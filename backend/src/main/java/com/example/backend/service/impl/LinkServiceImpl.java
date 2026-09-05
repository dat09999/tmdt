package com.example.backend.service.impl;

import com.example.backend.Enum.IMAGE_VIDEO;
import com.example.backend.Enum.Type;
import com.example.backend.module.Product;
import com.example.backend.module.ProductImage;

import com.example.backend.module.Shop;
import com.example.backend.module.User;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.service.LinkService;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC:
 *
 *  #26 (RẤT NGHIÊM TRỌNG) addLink() nhánh PRODUCT: bản gốc đọc TOÀN BỘ document Product rồi
 *      save() HAI LẦN liên tiếp (1 lần thừa không cần thiết, 1 lần để thêm ảnh mới) - tái
 *      phát đúng lỗi #12/#21 đã sửa ở ProductServiceImpl/ReviewServiceImpl, nhưng nhân đôi
 *      khe hở race condition vì gọi save() 2 lần. Nếu đúng lúc này có đơn hàng khác đang
 *      atomic trừ tồn kho (decrementStockAtomic), thay đổi đó sẽ bị ghi đè mất. Ngoài ra 2
 *      request upload ảnh song song (rất phổ biến khi UI cho chọn nhiều ảnh) sẽ làm mất ảnh
 *      của nhau vì cùng đọc-sửa-ghi mảng images.
 *      Fix: bỏ hẳn logic đọc-sửa-ghi, đổi sang atomic $push vào field "images", không đụng
 *      tới field nào khác (đặc biệt là "variants"/"stock") của Product. Cũng bỏ luôn lần
 *      save() đầu tiên vì nó hoàn toàn thừa (không có tác dụng gì, chỉ tạo thêm khe hở race
 *      condition mà không có ý nghĩa nghiệp vụ nào).
 *
 *  #27 addLink() nhánh Shop: tái phát đúng lỗi #24 đã sửa ở ShopServiceImpl, chỉ khác là
 *      xảy ra ở service này. Fix: atomic $set trên field logo/coverImage.
 *
 *  #28 (nghiêm trọng) deleteLink(): cùng lỗi đọc-sửa-ghi cả document Product như #26.
 *      Fix: atomic $pull trên field "images" với điều kiện khớp cả imageVideo và url.
 *
 *  LƯU Ý VỀ LOGIC NGHIỆP VỤ (không phải lỗi concurrency, chỉ ghi chú lại để bạn tự xác
 *  nhận): ở nhánh Shop, biến "main" đang được dùng NGƯỢC trực giác - main=false thì set
 *  logo, main=true thì set coverImage. Mình giữ nguyên logic gốc, không tự ý đổi vì không
 *  chắc đây là chủ ý hay nhầm lẫn, bạn kiểm tra lại giúp.
 */
@Service
@RequiredArgsConstructor
public class LinkServiceImpl implements LinkService {

    private final ProductRepository productRepository;
    private final ObjectStorageService objectStorageService;
    private final ShopRepository shopRepository;
    private final MongoTemplate mongoTemplate;

    @Value("${minio.bucket-name}")
    private  String bucket ;
    @Value("${minio.bucket-video}")
    private  String bucket1 ;
    @Value("${minio.bucket-user:user-images}")
    private  String userBucket;

    @Override
    public void addLink(Type type, String targetId, IMAGE_VIDEO imageVideo, MultipartFile file, boolean main) {
        try {
            String originalName = file.getOriginalFilename();

            String key = type.name().toLowerCase()
                    + "/" + targetId
                    + "/" + UUID.randomUUID()
                    + "_" + originalName;

            String targetBucket = bucket;
            if (type.equals(Type.USER)) {
                targetBucket = userBucket;
            } else if (imageVideo.equals(IMAGE_VIDEO.VIDEO)) {
                targetBucket = bucket1;
            }

            objectStorageService.putObject(targetBucket, key, file);

            if (type.equals(Type.PRODUCT)) {
                // FIX #26: atomic $push, không đọc/ghi cả document Product nữa.
                // $push tự động tạo mảng "images" nếu chưa tồn tại, không cần check null
                // như bản gốc. Field "variants"/"stock" hoàn toàn không bị đụng tới.
                ProductImage productImage = ProductImage.builder()
                        .url(key)
                        .isMain(main)
                        .imageVideo(imageVideo)
                        .build();

                Query query = Query.query(Criteria.where("_id").is(targetId));
                Update update = new Update().push("images", productImage);

                var result = mongoTemplate.updateFirst(query, update, Product.class);
                if (result.getMatchedCount() == 0) {
                    throw new RuntimeException("ko tìm thấy product");
                }
            } else if (type.equals(Type.USER)) {
                Query query = Query.query(Criteria.where("_id").is(targetId));
                Update update = new Update().set("url", key);

                var result = mongoTemplate.updateFirst(query, update, User.class);
                if (result.getMatchedCount() == 0) {
                    throw new RuntimeException("ko tìm thấy user");
                }
            } else {
                // FIX #27: atomic $set trên đúng field cần đổi, không ghi đè cả document Shop.
                shopRepository.findById(targetId)
                        .orElseThrow(() -> new RuntimeException("ko thay shop"));

                String fieldToUpdate = !main ? "logo" : "coverImage";
                Query query = Query.query(Criteria.where("_id").is(targetId));
                Update update = new Update().set(fieldToUpdate, key);

                var result = mongoTemplate.updateFirst(query, update, Shop.class);
                if (result.getMatchedCount() == 0) {
                    throw new RuntimeException("ko thay shop");
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Upload link failed", e);
        }
    }

    @Override
    public void deleteLink(Type type, String targetId, IMAGE_VIDEO imageVideo, String url) {
        try {
            if (type != Type.PRODUCT) {
                throw new RuntimeException("Hiện tại chỉ hỗ trợ xóa link cho PRODUCT");
            }

            // FIX #28: atomic $pull thay vì đọc product.getImages() rồi removeIf() + save()
            // cả document. Điều kiện match cả imageVideo lẫn url trong cùng 1 phần tử mảng.
            Query query = Query.query(Criteria.where("_id").is(targetId));
            Update update = new Update().pull("images",
                    Query.query(Criteria.where("imageVideo").is(imageVideo).and("url").is(url))
                            .getQueryObject());

            var result = mongoTemplate.updateFirst(query, update, Product.class);
            if (result.getMatchedCount() == 0) {
                throw new RuntimeException("Không tìm thấy product với id: " + targetId);
            }

        } catch (Exception e) {
            throw new RuntimeException("Delete link failed", e);
        }
    }

    @Override
    public List<String> getLinks(Type type, String targetId, IMAGE_VIDEO imageVideo) {
        try {
            if (type != Type.PRODUCT) {
                throw new RuntimeException("Hiện tại chỉ hỗ trợ lấy link cho PRODUCT");
            }

            if (imageVideo != IMAGE_VIDEO.IMAGE) {
                throw new RuntimeException("Hiện tại Product chỉ lưu image, chưa xử lý video");
            }

            Product product = productRepository.findById(targetId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy product với id: " + targetId));

            if (product.getImages() == null || product.getImages().isEmpty()) {
                return List.of();
            }

            return product.getImages()
                    .stream()
                    .map(ProductImage::getUrl)
                    .toList();

        } catch (Exception e) {
            throw new RuntimeException("Get links failed", e);
        }
    }

}