import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/theme";

// Warm up android browser session
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleAuth = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        path: "oauth-native-callback",
      });
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(main)");
      }
    } catch (err: any) {
      console.error("OAuth error", err);
      setErrorMsg(err?.errors?.[0]?.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow, router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.container}>
        {/* Header / Logo Section */}
        <View style={styles.logoSection}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: colors.primary, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="cube"
              size={48}
              color={colors.primaryForeground}
            />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            POCKET<Text style={{ color: colors.mutedForeground }}>CHECKER</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Double-check your pockets before you step out! Never forget your
            keys, wallet, or phone again.
          </Text>
        </View>

        {/* Auth Section */}
        <View style={styles.authSection}>
          {errorMsg ? (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color={colors.foreground} />
              <Text style={[styles.errorText, { color: colors.foreground }]}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.googleBtn,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
              },
            ]}
            onPress={handleGoogleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <>
                <Ionicons
                  name="logo-google"
                  size={20}
                  color={colors.primaryForeground}
                />
                <Text
                  style={[
                    styles.googleBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  CONTINUE WITH GOOGLE
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Sign in or create your PocketChecker account in seconds with your Google Account.
          </Text>
        </View>

        {/* Footer GitHub Link */}
        <TouchableOpacity
          style={[
            styles.githubBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() =>
            Linking.openURL("https://github.com/YogaDharma21/pocket-check")
          }
        >
          <Ionicons name="git-branch" size={16} color={colors.foreground} />
          <Text style={[styles.githubText, { color: colors.foreground }]}>
            github.com/yogaDharma21/pocket-check
          </Text>
          <Ionicons
            name="open-outline"
            size={12}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    marginTop: 24,
  },
  iconBox: {
    width: 84,
    height: 84,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  authSection: {
    gap: 16,
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  googleBtn: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  disclaimer: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  githubBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  githubText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
