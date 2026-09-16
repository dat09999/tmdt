package com.example.backend.domain.refund;

public interface StockGateway {

    void restore(String productId, String sku, int qty);
}