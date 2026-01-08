package ai.voicica.app.plugins;

import android.util.Log;

import androidx.annotation.NonNull;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

/**
 * Google Play Billing Plugin for Capacitor
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
                initBillingClient();
            }
        });
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ready", billingClient != null && billingClient.isReady());
        call.resolve(result);
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        String productIdsJson = call.getString("productIds");
        if (productIdsJson == null || productIdsJson.isEmpty()) {
            call.reject("productIds is required");
            return;
        }

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

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(@NonNull BillingResult billingResult, @NonNull QueryProductDetailsResult queryResult) {
                List<ProductDetails> list = queryResult.getProductDetailsList();
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && list != null) {
                    JSObject result = new JSObject();
                    StringBuilder productsJson = new StringBuilder("[");
                    for (int i = 0; i < list.size(); i++) {
                        ProductDetails details = list.get(i);
                        if (i > 0) productsJson.append(",");
                        productsJson.append("{");
                        productsJson.append("\"productId\":\"").append(details.getProductId()).append("\",");
                        productsJson.append("\"name\":\"").append(details.getName()).append("\",");
                        productsJson.append("\"title\":\"").append(details.getTitle()).append("\"");

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
            }
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null || productId.isEmpty()) {
            call.reject("productId is required");
            return;
        }

        // 如果 BillingClient 没准备好，尝试重新连接
        if (!billingClient.isReady()) {
            Log.d(TAG, "Billing client not ready, reconnecting...");
            billingClient.startConnection(new BillingClientStateListener() {
                @Override
                public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        Log.d(TAG, "Billing client reconnected, proceeding with purchase");
                        // 连接成功，继续购买流程
                        executePurchase(call, productId);
                    } else {
                        Log.e(TAG, "Billing client reconnection failed: " + billingResult.getDebugMessage());
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("cancelled", false);
                        result.put("error", "Unable to connect to Google Play. Please check your internet connection.");
                        call.resolve(result);
                    }
                }

                @Override
                public void onBillingServiceDisconnected() {
                    Log.w(TAG, "Billing service disconnected during purchase");
                }
            });
            return;
        }

        executePurchase(call, productId);
    }

    private void executePurchase(PluginCall call, String productId) {
        pendingPurchaseCall = call;

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

        billingClient.queryProductDetailsAsync(queryParams, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(@NonNull BillingResult billingResult, @NonNull QueryProductDetailsResult queryResult) {
                List<ProductDetails> list = queryResult.getProductDetailsList();
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || list == null || list.isEmpty()) {
                    if (pendingPurchaseCall != null) {
                        pendingPurchaseCall.reject("Product not found: " + productId);
                        pendingPurchaseCall = null;
                    }
                    return;
                }

                ProductDetails productDetails = list.get(0);
                List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();

                if (offers == null || offers.isEmpty()) {
                    if (pendingPurchaseCall != null) {
                        pendingPurchaseCall.reject("No subscription offers available");
                        pendingPurchaseCall = null;
                    }
                    return;
                }

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

                getActivity().runOnUiThread(() -> {
                    BillingResult result = billingClient.launchBillingFlow(getActivity(), billingFlowParams);
                    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        if (pendingPurchaseCall != null) {
                            pendingPurchaseCall.reject("Failed to launch billing flow: " + result.getDebugMessage());
                            pendingPurchaseCall = null;
                        }
                    }
                });
            }
        });
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) {
            Log.w(TAG, "No pending purchase call");
            return;
        }

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("cancelled", true);
            pendingPurchaseCall.resolve(result);
            pendingPurchaseCall = null;
        } else {
            // 返回错误信息而不是 reject，便于前端处理
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("cancelled", false);
            String errorMsg = billingResult.getDebugMessage();
            if (errorMsg == null || errorMsg.isEmpty()) {
                // 根据响应码提供默认错误信息
                int code = billingResult.getResponseCode();
                if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
                    errorMsg = "You already have an active subscription.";
                } else if (code == BillingClient.BillingResponseCode.ITEM_NOT_OWNED) {
                    errorMsg = "Subscription not found.";
                } else {
                    errorMsg = "Purchase could not be completed. Please try again.";
                }
            }
            result.put("error", errorMsg);
            pendingPurchaseCall.resolve(result);
            pendingPurchaseCall = null;
        }
    }

    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
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
