package ai.voicica.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import ai.voicica.app.plugins.AppodealPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 注册自定义插件
        registerPlugin(AppodealPlugin.class);

        super.onCreate(savedInstanceState);

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