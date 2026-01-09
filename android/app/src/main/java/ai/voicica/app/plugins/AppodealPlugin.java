package ai.voicica.app.plugins;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.appodeal.ads.Appodeal;
import com.appodeal.ads.RewardedVideoCallbacks;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Appodeal 广告插件
 *
 * 提供激励视频广告功能，支持连续播放多个广告
 */
@CapacitorPlugin(name = "Appodeal")
public class AppodealPlugin extends Plugin {

    private static final String TAG = "AppodealPlugin";
    private static final int DEFAULT_AD_COUNT = 2; // 默认连续播放广告数量

    private boolean isInitialized = false;
    private PluginCall pendingRewardCall = null;

    // 连续广告配置
    private int totalAdCount = DEFAULT_AD_COUNT;
    private int currentAdIndex = 0;
    private int completedAds = 0;
    private double totalRewardAmount = 0;
    private String rewardName = null;
    private boolean isAdSequenceRunning = false;

    /**
     * 初始化 Appodeal SDK
     */
    @PluginMethod
    public void initialize(PluginCall call) {
        String appKey = call.getString("appKey");
        Boolean testMode = call.getBoolean("testMode", false);

        if (appKey == null || appKey.isEmpty()) {
            call.reject("App key is required");
            return;
        }

        if (isInitialized) {
            Log.d(TAG, "Appodeal already initialized");
            call.resolve();
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                Appodeal.setTesting(testMode);
                Appodeal.setUseSafeArea(true);
                Appodeal.setAutoCache(Appodeal.REWARDED_VIDEO, true);

                setupRewardedVideoCallbacks();

                Appodeal.initialize(
                    getActivity(),
                    appKey,
                    Appodeal.REWARDED_VIDEO
                );

                isInitialized = true;
                Log.d(TAG, "Appodeal initialized successfully");
                call.resolve();

            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize Appodeal", e);
                call.reject("Failed to initialize Appodeal: " + e.getMessage());
            }
        });
    }

    /**
     * 设置连续播放广告数量
     */
    @PluginMethod
    public void setAdCount(PluginCall call) {
        Integer count = call.getInt("count", DEFAULT_AD_COUNT);
        if (count != null && count > 0 && count <= 5) {
            totalAdCount = count;
            Log.d(TAG, "Ad count set to " + totalAdCount);
            call.resolve();
        } else {
            call.reject("Invalid ad count. Must be between 1 and 5.");
        }
    }

    /**
     * 设置关闭按钮显示延迟（秒）- 保留接口兼容性，但不再使用悬浮层
     */
    @PluginMethod
    public void setCloseButtonDelay(PluginCall call) {
        // 不再使用悬浮层，此方法保留用于 API 兼容性
        Log.d(TAG, "setCloseButtonDelay called but overlay is disabled");
        call.resolve();
    }

    /**
     * 检查悬浮窗权限 - 保留接口兼容性，始终返回 true
     */
    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        // 不再需要悬浮窗权限
        JSObject result = new JSObject();
        result.put("hasPermission", true);
        call.resolve(result);
    }

    /**
     * 请求悬浮窗权限 - 保留接口兼容性，直接返回成功
     */
    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        // 不再需要悬浮窗权限
        call.resolve();
    }

    /**
     * 设置激励视频回调
     */
    private void setupRewardedVideoCallbacks() {
        Appodeal.setRewardedVideoCallbacks(new RewardedVideoCallbacks() {
            @Override
            public void onRewardedVideoLoaded(boolean isPrecache) {
                Log.d(TAG, "Rewarded video loaded, isPrecache: " + isPrecache);
                notifyListeners("rewardedVideoLoaded", new JSObject().put("isPrecache", isPrecache));
            }

            @Override
            public void onRewardedVideoFailedToLoad() {
                Log.e(TAG, "Rewarded video failed to load");
                notifyListeners("rewardedVideoFailedToLoad", new JSObject());

                if (isAdSequenceRunning) {
                    // 加载失败，结束广告序列
                    finishAdSequence(false, "Failed to load ad");
                }
            }

            @Override
            public void onRewardedVideoShown() {
                Log.d(TAG, "Rewarded video shown, ad " + (currentAdIndex + 1) + " of " + totalAdCount);
                notifyListeners("rewardedVideoShown", new JSObject());
            }

            @Override
            public void onRewardedVideoShowFailed() {
                Log.e(TAG, "Rewarded video show failed");
                notifyListeners("rewardedVideoShowFailed", new JSObject());

                if (isAdSequenceRunning) {
                    finishAdSequence(false, "Failed to show ad");
                }
            }

            @Override
            public void onRewardedVideoFinished(double amount, String name) {
                completedAds++;
                Log.d(TAG, "Rewarded video finished, ad " + completedAds + "/" + totalAdCount);

                // 累计奖励
                totalRewardAmount += amount;
                rewardName = name;

                // 通知前端广告完成
                JSObject data = new JSObject();
                data.put("amount", amount);
                data.put("name", name);
                data.put("adIndex", completedAds);
                data.put("totalAds", totalAdCount);
                notifyListeners("rewardedVideoFinished", data);

                // 只在第1个广告完成时发送领奖事件
                if (completedAds == 1) {
                    Log.d(TAG, "First ad completed, triggering reward claim");
                    JSObject rewardData = new JSObject();
                    rewardData.put("adIndex", 1);
                    rewardData.put("totalAds", totalAdCount);
                    notifyListeners("claimRewardNow", rewardData);
                }
            }

            @Override
            public void onRewardedVideoClosed(boolean finished) {
                Log.d(TAG, "Rewarded video closed, finished: " + finished +
                      ", completed: " + completedAds + "/" + totalAdCount);

                JSObject data = new JSObject();
                data.put("finished", finished);
                notifyListeners("rewardedVideoClosed", data);

                if (isAdSequenceRunning) {
                    currentAdIndex++;

                    // 检查是否还有更多广告要播放
                    if (currentAdIndex < totalAdCount && finished) {
                        // 延迟一下再播放下一个广告
                        new Handler(Looper.getMainLooper()).postDelayed(() -> {
                            showNextAd();
                        }, 500);
                    } else {
                        // 广告序列结束
                        finishAdSequence(completedAds > 0, null);
                    }
                }
            }

            @Override
            public void onRewardedVideoExpired() {
                Log.d(TAG, "Rewarded video expired");
                notifyListeners("rewardedVideoExpired", new JSObject());
            }

            @Override
            public void onRewardedVideoClicked() {
                Log.d(TAG, "Rewarded video clicked");
                notifyListeners("rewardedVideoClicked", new JSObject());
            }
        });
    }

    /**
     * 检查激励视频是否已加载
     */
    @PluginMethod
    public void isRewardedVideoLoaded(PluginCall call) {
        boolean isLoaded = Appodeal.isLoaded(Appodeal.REWARDED_VIDEO);
        JSObject result = new JSObject();
        result.put("isLoaded", isLoaded);
        call.resolve(result);
    }

    /**
     * 显示激励视频广告（连续播放）
     */
    @PluginMethod
    public void showRewardedVideo(PluginCall call) {
        if (!isInitialized) {
            call.reject("Appodeal not initialized");
            return;
        }

        if (isAdSequenceRunning) {
            call.reject("Ad sequence already running");
            return;
        }

        // 重置状态
        currentAdIndex = 0;
        completedAds = 0;
        totalRewardAmount = 0;
        rewardName = null;
        isAdSequenceRunning = true;
        pendingRewardCall = call;

        // 开始播放广告
        showNextAd();
    }

    /**
     * 显示下一个广告
     */
    private void showNextAd() {
        getActivity().runOnUiThread(() -> {
            if (Appodeal.isLoaded(Appodeal.REWARDED_VIDEO)) {
                Log.d(TAG, "Showing ad " + (currentAdIndex + 1) + " of " + totalAdCount);
                boolean shown = Appodeal.show(getActivity(), Appodeal.REWARDED_VIDEO);
                if (!shown) {
                    finishAdSequence(completedAds > 0, "Failed to show ad");
                }
            } else {
                Log.d(TAG, "Ad not loaded, caching...");
                Appodeal.cache(getActivity(), Appodeal.REWARDED_VIDEO);

                // 等待广告加载（最多 10 秒）
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (Appodeal.isLoaded(Appodeal.REWARDED_VIDEO)) {
                        showNextAd();
                    } else {
                        finishAdSequence(completedAds > 0, "Ad not available");
                    }
                }, 10000);
            }
        });
    }

    /**
     * 结束广告序列
     */
    private void finishAdSequence(boolean rewarded, String error) {
        isAdSequenceRunning = false;

        if (pendingRewardCall != null) {
            JSObject result = new JSObject();
            result.put("rewarded", rewarded);
            result.put("completedAds", completedAds);
            result.put("totalAds", totalAdCount);
            if (rewarded) {
                result.put("amount", totalRewardAmount);
                result.put("name", rewardName);
            }
            if (error != null) {
                result.put("error", error);
            }
            pendingRewardCall.resolve(result);
            pendingRewardCall = null;
        }

        // 重置状态
        currentAdIndex = 0;
        completedAds = 0;
        totalRewardAmount = 0;
        rewardName = null;
    }

    /**
     * 手动缓存激励视频
     */
    @PluginMethod
    public void cacheRewardedVideo(PluginCall call) {
        if (!isInitialized) {
            call.reject("Appodeal not initialized");
            return;
        }

        getActivity().runOnUiThread(() -> {
            Appodeal.cache(getActivity(), Appodeal.REWARDED_VIDEO);
            call.resolve();
        });
    }

    /**
     * 检查是否可以显示广告
     */
    @PluginMethod
    public void canShow(PluginCall call) {
        boolean canShow = Appodeal.canShow(Appodeal.REWARDED_VIDEO);
        JSObject result = new JSObject();
        result.put("canShow", canShow);
        call.resolve(result);
    }
}