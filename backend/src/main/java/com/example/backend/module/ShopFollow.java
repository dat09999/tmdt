package com.example.backend.module;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document("shop_follows")
@CompoundIndexes(@CompoundIndex(name="unique_user_shop_follow", def="{'userId':1,'shopId':1}", unique=true))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ShopFollow { @Id private String id; private String userId; private String shopId; private Date createdAt; }
