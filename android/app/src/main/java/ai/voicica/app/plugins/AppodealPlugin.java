package ai.voicica.app.plugins;

import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

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
 * 包含顶部进度条和广告计数器显示
 */
@CapacitorPlugin(name = "Appodeal")
public class AppodealPlugin extends Plugin {

    private static final String TAG = "AppodealPlugin";
    private static final int DEFAULT_AD_COUNT = 2; // 默认连续播放广告数量
    private static final int PROGRESS_UPDATE_INTERVAL = 100; // 进度更新间隔（毫秒）
    private static final int ESTIMATED_AD_DURATION = 30000; // 预估广告时长（毫秒）

    private boolean isInitialized = false;
    private PluginCall pendingRewardCall = null;

    // 连续广告配置
    private int totalAdCount = DEFAULT_AD_COUNT;
    private int currentAdIndex = 0;
    private int completedAds = 0;
    private double totalRewardAmount = 0;
    private String rewardName = null;
    private boolean isAdSequenceRunning = false;

    // 悬浮层 UI
    private WindowManager windowManager = null;
    private LinearLayout overlayContainer = null;
    private TextView adCounterText = null;
    private ProgressBar progressBar = null;
    private TextView closeButton = null;
    private Handler progressHandler = new Handler(Looper.getMainLooper());
    private Runnable progressRunnable = null;
    private Runnable showCloseButtonRunnable = null;
    private long adStartTime = 0;

    // 关闭按钮延迟（可配置）
    private int closeButtonDelaySeconds = 15; // 默认15秒

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
     * 设置关闭按钮显示延迟（秒）
     */
    @PluginMethod
    public void setCloseButtonDelay(PluginCall call) {
        Integer delay = call.getInt("delay", 15);
        if (delay != null && delay >= 5 && delay <= 60) {
            closeButtonDelaySeconds = delay;
            Log.d(TAG, "Close button delay set to " + closeButtonDelaySeconds + " seconds");
            call.resolve();
        } else {
            call.reject("Invalid delay. Must be between 5 and 60 seconds.");
        }
    }

    /**
     * 检查悬浮窗权限
     */
    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        boolean hasPermission = canDrawOverlays();
        JSObject result = new JSObject();
        result.put("hasPermission", hasPermission);
        call.resolve(result);
    }

    /**
     * 请求悬浮窗权限
     */
    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(getContext())) {
                try {
                    android.content.Intent intent = new android.content.Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        android.net.Uri.parse("package:" + getContext().getPackageName())
                    );
                    getActivity().startActivity(intent);
                    call.resolve();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to open overlay permission settings", e);
                    call.reject("Failed to open settings: " + e.getMessage());
                }
            } else {
                call.resolve();
            }
        } else {
            call.resolve();
        }
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

                adStartTime = System.currentTimeMillis();
                updateOverlayUI();
                startProgressUpdate();

                // 隐藏关闭按钮（如果之前显示过），然后重新调度
                hideCloseButton();
                scheduleShowCloseButton();
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

                stopProgressUpdate();

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

        // 显示悬浮层
        showOverlay();

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
                updateOverlayUI();
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
        hideOverlay();

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

    // ==================== 悬浮层 UI ====================

    /**
     * 检查悬浮窗权限
     */
    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getContext());
        }
        return true;
    }

    /**
     * 显示悬浮层
     */
    private void showOverlay() {
        if (!canDrawOverlays()) {
            Log.w(TAG, "No overlay permission, UI will not be shown");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                if (overlayContainer != null) {
                    hideOverlay();
                }

                windowManager = (WindowManager) getActivity().getSystemService(android.content.Context.WINDOW_SERVICE);

                // 创建容器
                overlayContainer = new LinearLayout(getActivity());
                overlayContainer.setOrientation(LinearLayout.VERTICAL);
                overlayContainer.setBackgroundColor(Color.parseColor("#CC000000")); // 半透明黑色
                overlayContainer.setPadding(dpToPx(16), dpToPx(8), dpToPx(16), dpToPx(8));

                // 第一行：广告计数器 + 关闭按钮
                LinearLayout topRow = new LinearLayout(getActivity());
                topRow.setOrientation(LinearLayout.HORIZONTAL);
                topRow.setGravity(Gravity.CENTER_VERTICAL);

                // 创建广告计数器文字
                adCounterText = new TextView(getActivity());
                adCounterText.setTextColor(Color.WHITE);
                adCounterText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
                adCounterText.setTypeface(null, Typeface.BOLD);
                adCounterText.setText("Ad 1 of " + totalAdCount);
                LinearLayout.LayoutParams counterParams = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f
                );
                adCounterText.setLayoutParams(counterParams);
                topRow.addView(adCounterText);

                // 创建关闭按钮（初始隐藏）
                closeButton = new TextView(getActivity());
                closeButton.setText("✕ Skip");
                closeButton.setTextColor(Color.WHITE);
                closeButton.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
                closeButton.setTypeface(null, Typeface.BOLD);
                closeButton.setBackgroundColor(Color.parseColor("#E53935")); // 红色背景
                closeButton.setPadding(dpToPx(12), dpToPx(4), dpToPx(12), dpToPx(4));
                closeButton.setVisibility(View.GONE); // 初始隐藏
                closeButton.setOnClickListener(v -> {
                    Log.d(TAG, "Close button clicked, forcing ad sequence end");
                    forceCloseAdSequence();
                });
                topRow.addView(closeButton);

                overlayContainer.addView(topRow);

                // 创建进度条
                progressBar = new ProgressBar(getActivity(), null, android.R.attr.progressBarStyleHorizontal);
                progressBar.setMax(1000);
                progressBar.setProgress(0);
                LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    dpToPx(4)
                );
                progressParams.topMargin = dpToPx(6);
                progressBar.setLayoutParams(progressParams);

                // 设置进度条颜色
                progressBar.getProgressDrawable().setColorFilter(
                    Color.parseColor("#9333EA"), // 紫色
                    android.graphics.PorterDuff.Mode.SRC_IN
                );
                overlayContainer.addView(progressBar);

                // 窗口参数 - 注意：需要可点击
                int windowType;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    windowType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
                } else {
                    windowType = WindowManager.LayoutParams.TYPE_SYSTEM_ALERT;
                }

                WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    windowType,
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    PixelFormat.TRANSLUCENT
                );
                params.gravity = Gravity.TOP;

                windowManager.addView(overlayContainer, params);
                Log.d(TAG, "Overlay shown");

            } catch (Exception e) {
                Log.e(TAG, "Failed to show overlay", e);
            }
        });
    }

    /**
     * 延迟显示关闭按钮
     */
    private void scheduleShowCloseButton() {
        cancelShowCloseButton();

        showCloseButtonRunnable = () -> {
            getActivity().runOnUiThread(() -> {
                if (closeButton != null) {
                    closeButton.setVisibility(View.VISIBLE);
                    Log.d(TAG, "Close button shown after " + closeButtonDelaySeconds + " seconds");
                }
            });
        };

        progressHandler.postDelayed(showCloseButtonRunnable, closeButtonDelaySeconds * 1000L);
        Log.d(TAG, "Close button scheduled to show in " + closeButtonDelaySeconds + " seconds");
    }

    /**
     * 取消显示关闭按钮的定时器
     */
    private void cancelShowCloseButton() {
        if (showCloseButtonRunnable != null) {
            progressHandler.removeCallbacks(showCloseButtonRunnable);
            showCloseButtonRunnable = null;
        }
    }

    /**
     * 隐藏关闭按钮（播放下一个广告时重置）
     */
    private void hideCloseButton() {
        getActivity().runOnUiThread(() -> {
            if (closeButton != null) {
                closeButton.setVisibility(View.GONE);
            }
        });
    }

    /**
     * 强制关闭广告序列
     */
    private void forceCloseAdSequence() {
        Log.d(TAG, "Force closing ad sequence");

        // 结束广告序列（已完成的广告仍然有效）
        finishAdSequence(completedAds > 0, "User skipped");

        // 尝试关闭广告界面
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().onBackPressed();
            } catch (Exception e) {
                Log.e(TAG, "Failed to close ad activity", e);
            }
        });
    }

    /**
     * 隐藏悬浮层
     */
    private void hideOverlay() {
        getActivity().runOnUiThread(() -> {
            try {
                stopProgressUpdate();
                cancelShowCloseButton();

                if (overlayContainer != null && windowManager != null) {
                    windowManager.removeView(overlayContainer);
                    overlayContainer = null;
                    adCounterText = null;
                    progressBar = null;
                    closeButton = null;
                    Log.d(TAG, "Overlay hidden");
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to hide overlay", e);
            }
        });
    }

    /**
     * 更新悬浮层 UI
     */
    private void updateOverlayUI() {
        getActivity().runOnUiThread(() -> {
            if (adCounterText != null) {
                adCounterText.setText("Ad " + (currentAdIndex + 1) + " of " + totalAdCount);
            }
            if (progressBar != null) {
                progressBar.setProgress(0);
            }
        });
    }

    /**
     * 开始更新进度条
     */
    private void startProgressUpdate() {
        stopProgressUpdate();

        progressRunnable = new Runnable() {
            @Override
            public void run() {
                if (progressBar != null && adStartTime > 0) {
                    long elapsed = System.currentTimeMillis() - adStartTime;
                    int progress = (int) ((elapsed * 1000) / ESTIMATED_AD_DURATION);
                    progress = Math.min(progress, 1000);
                    progressBar.setProgress(progress);

                    if (progress < 1000) {
                        progressHandler.postDelayed(this, PROGRESS_UPDATE_INTERVAL);
                    }
                }
            }
        };

        progressHandler.postDelayed(progressRunnable, PROGRESS_UPDATE_INTERVAL);
    }

    /**
     * 停止更新进度条
     */
    private void stopProgressUpdate() {
        if (progressRunnable != null) {
            progressHandler.removeCallbacks(progressRunnable);
            progressRunnable = null;
        }
        adStartTime = 0;
    }

    /**
     * dp 转 px
     */
    private int dpToPx(int dp) {
        float density = getActivity().getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }
}
