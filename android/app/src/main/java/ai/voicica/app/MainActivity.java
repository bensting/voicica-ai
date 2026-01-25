package ai.voicica.app;

import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.ActionMode;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import ai.voicica.app.plugins.AppodealPlugin;
import ai.voicica.app.plugins.AppOpenAdPlugin;
import ai.voicica.app.plugins.GooglePlayBillingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 注册自定义插件
        registerPlugin(AppodealPlugin.class);
        registerPlugin(AppOpenAdPlugin.class);
        registerPlugin(GooglePlayBillingPlugin.class);

        // 重要：在 super.onCreate() 之前设置主题！
        // 修复 Action Mode（文本选择）背景显示为 splash 的问题
        setTheme(R.style.AppTheme_NoActionBar);

        super.onCreate(savedInstanceState);

        // 设置自定义 User-Agent 用于平台识别
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        String ua = settings.getUserAgentString();
        settings.setUserAgentString(ua + " VoicicaApp/android");

        // 开启 WebView 调试（Chrome DevTools 远程调试）
        WebView.setWebContentsDebuggingEnabled(true);

        // Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Make status bar icons light (for dark/purple background)
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false); // false = light icons (for dark bg)
            controller.setAppearanceLightNavigationBars(true); // true = dark icons (for light bg)
        }
    }

    @Override
    public void onActionModeStarted(ActionMode mode) {
        super.onActionModeStarted(mode);
        // 强制设置 Action Mode 背景为深色，避免 splash 主题的背景
        if (mode != null && mode.getMenuView() != null) {
            mode.getMenuView().setBackgroundColor(0xFF1a1a2e); // 深色背景
        }
    }
}