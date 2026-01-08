package ai.voicica.app.plugins;

import android.util.Log;

import androidx.annotation.NonNull;

import com.android.billingclient.api.*;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

/**
 * Google Play Billing Plugin for Capacitor
 *
 * 简单直接的 Google Play 内购实现
 */
@CapacitorPlugin(name = "GooglePlayBilling")
public class GooglePlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "GooglePlayBilling";
    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;

    @Override
    public void load() {
        super.load();
        initBillingClient();
    }

    private void initBillingClient() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(
                    PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
                )
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Billing client connected");
                } else {
                    Log.e(TAG, "Billing client setup failed: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Billing service disconnected, will retry");
                // 重新连接
                initBillingClient();
            }
        });
    }

    /**
     * 检查是否已连接
     */
    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ready", billingClient != null && billingClient.isReady());
        call.resolve(result);
    }

    /**
     * 获取产品信息
     */
    @PluginMethod
    public void getProducts(PluginCall call) {
        String productIdsJson = call.getString("productIds");
        if (productIdsJson == null || productIdsJson.isEmpty()) {
            call.reject("productIds is required");
            return;
        }

        // 解析产品 ID 列表
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        String[] productIds = productIdsJson.split(",");
        for (String productId : productIds) {
            productList.add(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId.trim())
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            );
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && productDetailsList != null) {
                JSObject result = new JSObject();
                StringBuilder productsJson = new StringBuilder("[");
                for (int i = 0; i < productDetailsList.size(); i++) {
                    ProductDetails details = productDetailsList.get(i);
                    if (i > 0) productsJson.append(",");
                    productsJson.append("{");
                    productsJson.append("\"productId\":\"").append(details.getProductId()).append("\",");
                    productsJson.append("\"name\":\"").append(details.getName()).append("\",");
                    productsJson.append("\"title\":\"").append(details.getTitle()).append("\"");

                    // 获取订阅价格
                    List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                    if (offers != null && !offers.isEmpty()) {
                        ProductDetails.PricingPhase phase = offers.get(0).getPricingPhases().getPricingPhaseList().get(0);
                        productsJson.append(",\"price\":\"").append(phase.getFormattedPrice()).append("\"");
                        productsJson.append(",\"priceAmountMicros\":").append(phase.getPriceAmountMicros());
                        productsJson.append(",\"priceCurrencyCode\":\"").append(phase.getPriceCurrencyCode()).append("\"");
                    }
                    productsJson.append("}");
                }
                productsJson.append("]");
                result.put("products", productsJson.toString());
                call.resolve(result);
            } else {
                call.reject("Failed to get products: " + billingResult.getDebugMessage());
            }
        });
    }

    /**
     * 发起购买
     */
    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null || productId.isEmpty()) {
            call.reject("productId is required");
            return;
        }

        if (!billingClient.isReady()) {
            call.reject("Billing client not ready");
            return;
        }

        // 保存 call 以便在回调中使用
        pendingPurchaseCall = call;

        // 先查询产品详情
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        );

        QueryProductDetailsParams queryParams = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(queryParams, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || productDetailsList == null || productDetailsList.isEmpty()) {
                pendingPurchaseCall.reject("Product not found: " + productId);
                pendingPurchaseCall = null;
                return;
            }

            ProductDetails productDetails = productDetailsList.get(0);
            List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();

            if (offers == null || offers.isEmpty()) {
                pendingPurchaseCall.reject("No subscription offers available");
                pendingPurchaseCall = null;
                return;
            }

            // 构建购买参数
            List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
            productDetailsParamsList.add(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails)
                    .setOfferToken(offers.get(0).getOfferToken())
                    .build()
            );

            BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(productDetailsParamsList)
                    .build();

            // 启动购买流程
            getActivity().runOnUiThread(() -> {
                BillingResult result = billingClient.launchBillingFlow(getActivity(), billingFlowParams);
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    pendingPurchaseCall.reject("Failed to launch billing flow: " + result.getDebugMessage());
                    pendingPurchaseCall = null;
                }
            });
        });
    }

    /**
     * 购买结果回调
     */
    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) {
            Log.w(TAG, "No pending purchase call");
            return;
        }

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                // 确认购买
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("cancelled", true);
            pendingPurchaseCall.resolve(result);
            pendingPurchaseCall = null;
        } else {
            pendingPurchaseCall.reject("Purchase failed: " + billingResult.getDebugMessage());
            pendingPurchaseCall = null;
        }
    }

    /**
     * 确认购买
     */
    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            // 确认购买（订阅类型）
            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgePurchaseParams =
                        AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.getPurchaseToken())
                                .build();

                billingClient.acknowledgePurchase(acknowledgePurchaseParams, ackResult -> {
                    if (ackResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        Log.d(TAG, "Purchase acknowledged");
                    }
                });
            }

            // 返回购买成功结果
            if (pendingPurchaseCall != null) {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("cancelled", false);
                result.put("purchaseToken", purchase.getPurchaseToken());
                result.put("orderId", purchase.getOrderId());
                result.put("productId", purchase.getProducts().get(0));
                pendingPurchaseCall.resolve(result);
                pendingPurchaseCall = null;
            }
        }
    }

    /**
     * 恢复购买（查询已购买的订阅）
     */
    @PluginMethod
    public void restorePurchases(PluginCall call) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                JSObject result = new JSObject();
                StringBuilder purchasesJson = new StringBuilder("[");
                for (int i = 0; i < purchases.size(); i++) {
                    Purchase purchase = purchases.get(i);
                    if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                        if (i > 0) purchasesJson.append(",");
                        purchasesJson.append("{");
                        purchasesJson.append("\"productId\":\"").append(purchase.getProducts().get(0)).append("\",");
                        purchasesJson.append("\"purchaseToken\":\"").append(purchase.getPurchaseToken()).append("\",");
                        purchasesJson.append("\"orderId\":\"").append(purchase.getOrderId()).append("\"");
                        purchasesJson.append("}");
                    }
                }
                purchasesJson.append("]");
                result.put("purchases", purchasesJson.toString());
                call.resolve(result);
            } else {
                call.reject("Failed to restore purchases: " + billingResult.getDebugMessage());
            }
        });
    }
}
