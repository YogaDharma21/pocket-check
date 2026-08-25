import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
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
      <View style={styles.centerContainer}>
        {/* Branding Section */}
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
    width: "100%",
  },
  iconBox: {
    width: 86,
    height: 86,
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  authSection: {
    width: "100%",
    gap: 12,
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
    width: "100%",
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
