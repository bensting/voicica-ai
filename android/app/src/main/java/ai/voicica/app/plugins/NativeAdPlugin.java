package ai.voicica.app.plugins;

import android.util.Log;
import android.view.View;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.VideoOptions;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdOptions;

/**
 * Native Advanced Ad Plugin
 *
 * 提供 Google AdMob 原生高级广告功能
 * 用于在信息流中展示原生广告
 */
@CapacitorPlugin(name = "NativeAd")
public class NativeAdPlugin extends Plugin {

    private static final String TAG = "NativeAdPlugin";

    private NativeAd currentNativeAd = null;
    private boolean isLoading = false;
    private boolean isInitialized = false;

    /**
     * 初始化 AdMob SDK
     */
    @PluginMethod
    public void initialize(PluginCall call) {
        if (isInitialized) {
            Log.d(TAG, "AdMob already initialized");
            call.resolve();
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                MobileAds.initialize(getContext(), initializationStatus -> {
                    isInitialized = true;
                    Log.d(TAG, "AdMob SDK initialized for Native Ads");
                    call.resolve();
                });
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize AdMob", e);
                call.reject("Failed to initialize AdMob: " + e.getMessage());
            }
        });
    }

    /**
     * 加载原生广告
     */
    @PluginMethod
    public void loadAd(PluginCall call) {
        String adUnitId = call.getString("adUnitId");

        if (adUnitId == null || adUnitId.isEmpty()) {
            call.reject("adUnitId is required");
            return;
        }

        if (isLoading) {
            Log.d(TAG, "Ad already loading");
            call.reject("Ad already loading");
            return;
        }

        // 销毁之前的广告
        destroyCurrentAd();

        isLoading = true;

        getActivity().runOnUiThread(() -> {
            // 视频选项
            VideoOptions videoOptions = new VideoOptions.Builder()
                    .setStartMuted(true)
                    .build();

            // 原生广告选项
            NativeAdOptions adOptions = new NativeAdOptions.Builder()
                    .setVideoOptions(videoOptions)
                    .setAdChoicesPlacement(NativeAdOptions.ADCHOICES_TOP_RIGHT)
                    .setMediaAspectRatio(NativeAdOptions.NATIVE_MEDIA_ASPECT_RATIO_LANDSCAPE)
                    .build();

            // 创建广告加载器
            AdLoader adLoader = new AdLoader.Builder(getContext(), adUnitId)
                    .forNativeAd(nativeAd -> {
                        currentNativeAd = nativeAd;
                        isLoading = false;
                        Log.d(TAG, "Native Ad loaded successfully");

                        // 将广告数据转换为 JSON 返回给 JS
                        JSObject adData = convertNativeAdToJson(nativeAd);
                        notifyListeners("adLoaded", adData);
                        call.resolve(adData);
                    })
                    .withAdListener(new AdListener() {
                        @Override
                        public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                            isLoading = false;
                            Log.e(TAG, "Native Ad failed to load: " + loadAdError.getMessage());

                            JSObject error = new JSObject();
                            error.put("code", loadAdError.getCode());
                            error.put("message", loadAdError.getMessage());
                            notifyListeners("adFailedToLoad", error);
                            call.reject("Failed to load ad: " + loadAdError.getMessage());
                        }

                        @Override
                        public void onAdClicked() {
                            Log.d(TAG, "Native Ad clicked");
                            notifyListeners("adClicked", new JSObject());
                        }

                        @Override
                        public void onAdImpression() {
                            Log.d(TAG, "Native Ad impression");
                            notifyListeners("adImpression", new JSObject());
                        }

                        @Override
                        public void onAdOpened() {
                            Log.d(TAG, "Native Ad opened");
                            notifyListeners("adOpened", new JSObject());
                        }

                        @Override
                        public void onAdClosed() {
                            Log.d(TAG, "Native Ad closed");
                            notifyListeners("adClosed", new JSObject());
                        }
                    })
                    .withNativeAdOptions(adOptions)
                    .build();

            // 发起广告请求
            AdRequest adRequest = new AdRequest.Builder().build();
            adLoader.loadAd(adRequest);
        });
    }

    /**
     * 记录广告点击（手动触发）
     */
    @PluginMethod
    public void recordClick(PluginCall call) {
        if (currentNativeAd == null) {
            call.reject("No ad loaded");
            return;
        }

        // 原生广告的点击由 AdMob SDK 自动处理
        // 这个方法只是通知 JS 层点击已记录
        Log.d(TAG, "Click recorded");
        call.resolve();
    }

    /**
     * 记录广告展示
     */
    @PluginMethod
    public void recordImpression(PluginCall call) {
        if (currentNativeAd == null) {
            call.reject("No ad loaded");
            return;
        }

        // 原生广告的展示由 AdMob SDK 自动处理
        Log.d(TAG, "Impression recorded");
        call.resolve();
    }

    /**
     * 销毁当前广告
     */
    @PluginMethod
    public void destroy(PluginCall call) {
        destroyCurrentAd();
        call.resolve();
    }

    /**
     * 检查广告是否已加载
     */
    @PluginMethod
    public void isAdLoaded(PluginCall call) {
        JSObject result = new JSObject();
        result.put("loaded", currentNativeAd != null);
        call.resolve(result);
    }

    /**
     * 获取当前广告数据
     */
    @PluginMethod
    public void getAdData(PluginCall call) {
        if (currentNativeAd == null) {
            call.reject("No ad loaded");
            return;
        }

        JSObject adData = convertNativeAdToJson(currentNativeAd);
        call.resolve(adData);
    }

    /**
     * 将原生广告转换为 JSON 对象
     */
    private JSObject convertNativeAdToJson(NativeAd nativeAd) {
        JSObject adData = new JSObject();

        // 标题
        if (nativeAd.getHeadline() != null) {
            adData.put("headline", nativeAd.getHeadline());
        }

        // 正文
        if (nativeAd.getBody() != null) {
            adData.put("body", nativeAd.getBody());
        }

        // 广告来源
        if (nativeAd.getAdvertiser() != null) {
            adData.put("advertiser", nativeAd.getAdvertiser());
        }

        // CTA 按钮文字
        if (nativeAd.getCallToAction() != null) {
            adData.put("callToAction", nativeAd.getCallToAction());
        }

        // 图标 URL
        if (nativeAd.getIcon() != null && nativeAd.getIcon().getUri() != null) {
            adData.put("iconUrl", nativeAd.getIcon().getUri().toString());
        }

        // 星级评分
        if (nativeAd.getStarRating() != null) {
            adData.put("starRating", nativeAd.getStarRating());
        }

        // 价格
        if (nativeAd.getPrice() != null) {
            adData.put("price", nativeAd.getPrice());
        }

        // 商店名称
        if (nativeAd.getStore() != null) {
            adData.put("store", nativeAd.getStore());
        }

        // 媒体内容
        if (nativeAd.getMediaContent() != null) {
            JSObject mediaContent = new JSObject();
            mediaContent.put("aspectRatio", nativeAd.getMediaContent().getAspectRatio());
            mediaContent.put("hasVideoContent", nativeAd.getMediaContent().hasVideoContent());
            adData.put("mediaContent", mediaContent);
        }

        // 图片列表
        if (nativeAd.getImages() != null && !nativeAd.getImages().isEmpty()) {
            // 获取第一张图片的 URI
            NativeAd.Image firstImage = nativeAd.getImages().get(0);
            if (firstImage.getUri() != null) {
                adData.put("imageUrl", firstImage.getUri().toString());
            }
        }

        return adData;
    }

    /**
     * 销毁当前广告
     */
    private void destroyCurrentAd() {
        if (currentNativeAd != null) {
            currentNativeAd.destroy();
            currentNativeAd = null;
            Log.d(TAG, "Native Ad destroyed");
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        destroyCurrentAd();
    }
}
