package ai.voicica.app.plugins;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.appopen.AppOpenAd;

/**
 * App Open 广告插件
 *
 * 提供 Google AdMob App Open 广告功能
 * 专为应用启动和从后台恢复时显示广告设计
 */
@CapacitorPlugin(name = "AppOpenAd")
public class AppOpenAdPlugin extends Plugin {

    private static final String TAG = "AppOpenAdPlugin";

    private AppOpenAd appOpenAd = null;
    private boolean isLoadingAd = false;
    private boolean isShowingAd = false;
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
                    Log.d(TAG, "AdMob SDK initialized");
                    call.resolve();
                });
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize AdMob", e);
                call.reject("Failed to initialize AdMob: " + e.getMessage());
            }
        });
    }

    /**
     * 加载 App Open 广告
     */
    @PluginMethod
    public void loadAd(PluginCall call) {
        String adUnitId = call.getString("adUnitId");

        if (adUnitId == null || adUnitId.isEmpty()) {
            call.reject("adUnitId is required");
            return;
        }

        if (isLoadingAd || isAdAvailable()) {
            Log.d(TAG, "Ad already loading or available");
            call.resolve();
            return;
        }

        isLoadingAd = true;

        getActivity().runOnUiThread(() -> {
            AdRequest request = new AdRequest.Builder().build();

            AppOpenAd.load(
                getContext(),
                adUnitId,
                request,
                new AppOpenAd.AppOpenAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull AppOpenAd ad) {
                        appOpenAd = ad;
                        isLoadingAd = false;
                        Log.d(TAG, "App Open Ad loaded");

                        JSObject result = new JSObject();
                        result.put("loaded", true);
                        notifyListeners("adLoaded", result);
                        call.resolve(result);
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                        isLoadingAd = false;
                        Log.e(TAG, "App Open Ad failed to load: " + loadAdError.getMessage());

                        JSObject result = new JSObject();
                        result.put("loaded", false);
                        result.put("error", loadAdError.getMessage());
                        notifyListeners("adFailedToLoad", result);
                        call.reject("Failed to load ad: " + loadAdError.getMessage());
                    }
                }
            );
        });
    }

    /**
     * 显示 App Open 广告
     */
    @PluginMethod
    public void showAd(PluginCall call) {
        if (!isAdAvailable()) {
            call.reject("No ad available");
            return;
        }

        if (isShowingAd) {
            call.reject("Ad already showing");
            return;
        }

        getActivity().runOnUiThread(() -> {
            appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    appOpenAd = null;
                    isShowingAd = false;
                    Log.d(TAG, "App Open Ad dismissed");

                    JSObject result = new JSObject();
                    result.put("dismissed", true);
                    notifyListeners("adDismissed", result);
                }

                @Override
                public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                    appOpenAd = null;
                    isShowingAd = false;
                    Log.e(TAG, "App Open Ad failed to show: " + adError.getMessage());

                    JSObject result = new JSObject();
                    result.put("error", adError.getMessage());
                    notifyListeners("adFailedToShow", result);
                }

                @Override
                public void onAdShowedFullScreenContent() {
                    isShowingAd = true;
                    Log.d(TAG, "App Open Ad showing");

                    JSObject result = new JSObject();
                    result.put("shown", true);
                    notifyListeners("adShown", result);
                }

                @Override
                public void onAdClicked() {
                    Log.d(TAG, "App Open Ad clicked");
                    notifyListeners("adClicked", new JSObject());
                }

                @Override
                public void onAdImpression() {
                    Log.d(TAG, "App Open Ad impression");
                    notifyListeners("adImpression", new JSObject());
                }
            });

            Activity activity = getActivity();
            if (activity != null) {
                appOpenAd.show(activity);

                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } else {
                call.reject("Activity not available");
            }
        });
    }

    /**
     * 检查广告是否已加载
     */
    @PluginMethod
    public void isAdLoaded(PluginCall call) {
        JSObject result = new JSObject();
        result.put("loaded", isAdAvailable());
        call.resolve(result);
    }

    /**
     * 检查广告是否可用
     */
    private boolean isAdAvailable() {
        return appOpenAd != null;
    }
}