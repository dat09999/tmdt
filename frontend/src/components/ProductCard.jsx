export default function ProductCard({ product, onAddToCart }) {
  const imageUrl = product.images?.find(img => img.isMain)?.url || 
                   product.images?.[0]?.url || 
                   "https://via.placeholder.com/400x400?text=DoMix";

  const firstVariant = product.variants?.[0];
  const currentPrice = firstVariant?.discountPrice || firstVariant?.price || product.basePrice;
  const originalPrice = firstVariant?.price;

  const hasDiscount = firstVariant?.discountPrice && originalPrice > firstVariant.discountPrice;

  return (
    <div className="product-card group">
      {/* Image */}
      <div className="product-image-container relative h-80 bg-gray-100">
        <img 
          src={imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Badges */}
        {hasDiscount && (
          <div className="absolute top-4 left-4 bg-[#e11d48] text-white text-xs font-bold px-3.5 py-1 rounded-full tracking-wider">
            GIẢM {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
          </div>
        )}
        
        {product.status === "HOT" && (
          <div className="absolute top-4 right-4 bg-[#facc15] text-[#0f172a] text-xs font-black px-3 py-1 rounded-full">
            HOT
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-[17px] leading-tight line-clamp-2 mb-1.5 group-hover:text-[#0f172a]">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-1">{product.brand || "DoMix Official"}</p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-5">
          <span className="text-2xl font-black text-[#0f172a]">
            {currentPrice?.toLocaleString('vi-VN')}₫
          </span>
          {hasDiscount && (
            <span className="text-base text-gray-400 line-through">
              {originalPrice?.toLocaleString('vi-VN')}₫
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={() => onAddToCart(product)}
            className="btn-gold flex-1 text-sm py-3 active:scale-[0.985]"
          >
            Thêm giỏ hàng
          </button>
          <button 
            onClick={() => window.location.href = `/product/${product.id}`}
            className="btn-secondary flex-1 text-sm py-3 active:scale-[0.985]"
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
