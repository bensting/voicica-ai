package ai.voicica.app.plugins;

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
 * 提供激励视频广告功能，用于每日任务中的"观看视频赚积分"
 */
@CapacitorPlugin(name = "Appodeal")
public class AppodealPlugin extends Plugin {

    private static final String TAG = "AppodealPlugin";
    private boolean isInitialized = false;
    private PluginCall pendingRewardCall = null;

    // 奖励状态
    private boolean hasReward = false;
    private double rewardedAmount = 0;
    private String rewardedName = null;

    /**
     * 初始化 Appodeal SDK
     *
     * @param call 包含 appKey 参数
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
                // 设置测试模式
                Appodeal.setTesting(testMode);

                // 启用安全区域支持（避免圆角/刘海屏遮挡广告UI元素）
                Appodeal.setUseSafeArea(true);

                // 设置自动缓存
                Appodeal.setAutoCache(Appodeal.REWARDED_VIDEO, true);

                // 设置回调
                setupRewardedVideoCallbacks();

                // 初始化 SDK（仅激励视频）
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

                if (pendingRewardCall != null) {
                    JSObject result = new JSObject();
                    result.put("rewarded", false);
                    result.put("error", "Failed to load ad");
                    pendingRewardCall.resolve(result);
                    pendingRewardCall = null;
                }
            }

            @Override
            public void onRewardedVideoShown() {
                Log.d(TAG, "Rewarded video shown");
                notifyListeners("rewardedVideoShown", new JSObject());
            }

            @Override
            public void onRewardedVideoShowFailed() {
                Log.e(TAG, "Rewarded video show failed");
                notifyListeners("rewardedVideoShowFailed", new JSObject());

                if (pendingRewardCall != null) {
                    JSObject result = new JSObject();
                    result.put("rewarded", false);
                    result.put("error", "Failed to show ad");
                    pendingRewardCall.resolve(result);
                    pendingRewardCall = null;
                }
            }

            @Override
            public void onRewardedVideoFinished(double amount, String name) {
                Log.d(TAG, "Rewarded video finished, amount: " + amount + ", name: " + name);
                JSObject data = new JSObject();
                data.put("amount", amount);
                data.put("name", name);
                notifyListeners("rewardedVideoFinished", data);

                // 立即返回奖励结果（不等待广告关闭，因为测试广告可能没有关闭按钮）
                if (pendingRewardCall != null) {
                    Log.d(TAG, "Immediately resolving reward");
                    JSObject result = new JSObject();
                    result.put("rewarded", true);
                    result.put("amount", amount);
                    result.put("name", name);
                    pendingRewardCall.resolve(result);
                    pendingRewardCall = null;
                }

                // 标记已处理
                hasReward = true;
                rewardedAmount = amount;
                rewardedName = name;
            }

            @Override
            public void onRewardedVideoClosed(boolean finished) {
                Log.d(TAG, "Rewarded video closed, finished: " + finished + ", hasReward: " + hasReward);
                JSObject data = new JSObject();
                data.put("finished", finished);
                notifyListeners("rewardedVideoClosed", data);

                // 统一在关闭时处理结果
                if (pendingRewardCall != null) {
                    JSObject result = new JSObject();
                    if (hasReward) {
                        // 用户完整观看了广告
                        result.put("rewarded", true);
                        result.put("amount", rewardedAmount);
                        result.put("name", rewardedName);
                    } else {
                        // 用户中途关闭
                        result.put("rewarded", false);
                        result.put("error", "Ad closed before completion");
                    }
                    pendingRewardCall.resolve(result);
                    pendingRewardCall = null;

                    // 重置奖励状态
                    hasReward = false;
                    rewardedAmount = 0;
                    rewardedName = null;
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
     * 显示激励视频广告
     *
     * @return 返回 Promise，包含 rewarded 字段表示是否获得奖励
     */
    @PluginMethod
    public void showRewardedVideo(PluginCall call) {
        if (!isInitialized) {
            call.reject("Appodeal not initialized");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (Appodeal.isLoaded(Appodeal.REWARDED_VIDEO)) {
                // 保存 call 以便在回调中使用
                pendingRewardCall = call;

                boolean shown = Appodeal.show(getActivity(), Appodeal.REWARDED_VIDEO);
                if (!shown) {
                    pendingRewardCall = null;
                    JSObject result = new JSObject();
                    result.put("rewarded", false);
                    result.put("error", "Failed to show ad");
                    call.resolve(result);
                }
            } else {
                JSObject result = new JSObject();
                result.put("rewarded", false);
                result.put("error", "Ad not loaded");
                call.resolve(result);
            }
        });
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
     * 检查是否可以显示广告（基于频率规则等）
     */
    @PluginMethod
    public void canShow(PluginCall call) {
        boolean canShow = Appodeal.canShow(Appodeal.REWARDED_VIDEO);
        JSObject result = new JSObject();
        result.put("canShow", canShow);
        call.resolve(result);
    }
}
