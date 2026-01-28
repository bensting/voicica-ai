package ai.voicica.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import ai.voicica.app.plugins.AppOpenAdPlugin;
import ai.voicica.app.plugins.GooglePlayBillingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 强制设置主题，必须在 super.onCreate() 之前调用
        // 修复 Action Mode（文本选择）背景显示为 splash 的问题
        setTheme(R.style.AppTheme_NoActionBar);

        // 注册自定义插件
        registerPlugin(AppOpenAdPlugin.class);
        registerPlugin(GooglePlayBillingPlugin.class);

        super.onCreate(savedInstanceState);

        // 强制设置 window 背景为深色，防止 ActionMode 继承 splash 背景
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.parseColor("#0a0a1a")));

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
}