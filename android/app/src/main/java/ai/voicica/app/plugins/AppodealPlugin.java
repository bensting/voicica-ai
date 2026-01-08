package ai.voicica.app.plugins;

import android.animation.ObjectAnimator;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.LinearInterpolator;
import android.widget.ProgressBar;

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
 * 包含超时保护机制：显示顶部进度条，超时后强制关闭广告
 */
@CapacitorPlugin(name = "Appodeal")
public class AppodealPlugin extends Plugin {

    private static final String TAG = "AppodealPlugin";
    private static final int DEFAULT_TIMEOUT_SECONDS = 60; // 默认超时时间（秒）

    private boolean isInitialized = false;
    private PluginCall pendingRewardCall = null;

    // 超时处理
    private Handler timeoutHandler = new Handler(Looper.getMainLooper());
    private Runnable timeoutRunnable = null;
    private int adTimeoutSeconds = DEFAULT_TIMEOUT_SECONDS;

    // 进度条相关
    private ProgressBar progressBar = null;
    private WindowManager windowManager = null;
    private ObjectAnimator progressAnimator = null;

    // 奖励状态
    private boolean hasReward = false;
    private double rewardedAmount = 0;
    private String rewardedName = null;
    private boolean isAdShowing = false;

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
                isAdShowing = true;
                notifyListeners("rewardedVideoShown", new JSObject());

                // 显示进度条并启动超时计时器
                showProgressBar();
                startTimeoutTimer();
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
                isAdShowing = false;

                // 清理进度条和超时计时器
                hideProgressBar();
                cancelTimeoutTimer();

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

    /**
     * 设置广告超时时间（秒）
     */
    @PluginMethod
    public void setAdTimeout(PluginCall call) {
        Integer timeout = call.getInt("timeout", DEFAULT_TIMEOUT_SECONDS);
        adTimeoutSeconds = timeout;
        Log.d(TAG, "Ad timeout set to " + adTimeoutSeconds + " seconds");
        call.resolve();
    }

    /**
     * 显示顶部进度条
     */
    private void showProgressBar() {
        getActivity().runOnUiThread(() -> {
            try {
                if (progressBar != null) {
                    hideProgressBar();
                }

                windowManager = (WindowManager) getActivity().getSystemService(android.content.Context.WINDOW_SERVICE);

                // 创建水平进度条
                progressBar = new ProgressBar(getActivity(), null, android.R.attr.progressBarStyleHorizontal);
                progressBar.setMax(1000);
                progressBar.setProgress(1000);
                progressBar.setScaleY(2f); // 加粗进度条

                // 设置进度条颜色为紫色（与 APP 主题一致）
                progressBar.getProgressDrawable().setColorFilter(
                    Color.parseColor("#9333EA"), // 紫色
                    android.graphics.PorterDuff.Mode.SRC_IN
                );

                // 设置窗口参数
                WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    16, // 高度 16px
                    WindowManager.LayoutParams.TYPE_APPLICATION_PANEL,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    PixelFormat.TRANSLUCENT
                );
                params.gravity = Gravity.TOP;
                params.token = getActivity().getWindow().getDecorView().getWindowToken();

                windowManager.addView(progressBar, params);

                // 启动进度条动画（从满到空）
                progressAnimator = ObjectAnimator.ofInt(progressBar, "progress", 1000, 0);
                progressAnimator.setDuration(adTimeoutSeconds * 1000L);
                progressAnimator.setInterpolator(new LinearInterpolator());
                progressAnimator.start();

                Log.d(TAG, "Progress bar shown");
            } catch (Exception e) {
                Log.e(TAG, "Failed to show progress bar", e);
            }
        });
    }

    /**
     * 隐藏进度条
     */
    private void hideProgressBar() {
        getActivity().runOnUiThread(() -> {
            try {
                if (progressAnimator != null) {
                    progressAnimator.cancel();
                    progressAnimator = null;
                }

                if (progressBar != null && windowManager != null) {
                    windowManager.removeView(progressBar);
                    progressBar = null;
                    Log.d(TAG, "Progress bar hidden");
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to hide progress bar", e);
            }
        });
    }

    /**
     * 启动超时计时器
     */
    private void startTimeoutTimer() {
        cancelTimeoutTimer();

        timeoutRunnable = () -> {
            Log.d(TAG, "Ad timeout reached (" + adTimeoutSeconds + "s), forcing close");

            if (isAdShowing) {
                isAdShowing = false;

                // 隐藏进度条
                hideProgressBar();

                // 强制给奖励（因为用户已经等待了足够长的时间）
                if (pendingRewardCall != null) {
                    Log.d(TAG, "Timeout: giving reward to user");
                    JSObject result = new JSObject();
                    result.put("rewarded", true);
                    result.put("amount", 1.0);
                    result.put("name", "timeout_reward");
                    result.put("timeout", true); // 标记是超时给的奖励
                    pendingRewardCall.resolve(result);
                    pendingRewardCall = null;
                }

                // 重置奖励状态
                hasReward = false;
                rewardedAmount = 0;
                rewardedName = null;

                // 通知前端广告超时关闭
                JSObject data = new JSObject();
                data.put("timeout", true);
                notifyListeners("rewardedVideoClosed", data);

                // 尝试关闭广告（返回上一个 Activity）
                getActivity().runOnUiThread(() -> {
                    try {
                        // 尝试按返回键关闭广告
                        getActivity().onBackPressed();
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to close ad activity", e);
                    }
                });
            }
        };

        timeoutHandler.postDelayed(timeoutRunnable, adTimeoutSeconds * 1000L);
        Log.d(TAG, "Timeout timer started: " + adTimeoutSeconds + " seconds");
    }

    /**
     * 取消超时计时器
     */
    private void cancelTimeoutTimer() {
        if (timeoutRunnable != null) {
            timeoutHandler.removeCallbacks(timeoutRunnable);
            timeoutRunnable = null;
            Log.d(TAG, "Timeout timer cancelled");
        }
    }
}
