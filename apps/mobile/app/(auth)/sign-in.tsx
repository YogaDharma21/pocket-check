import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/theme";

export default function SignInScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();

  const [mode, setMode] = useState<"welcome" | "login" | "signup">("welcome");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isSignInLoaded) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      await setSignInActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!isSignUpLoaded) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await signUp.create({
        emailAddress,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isSignUpLoaded) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      await setSignUpActive({ session: completeSignUp.createdSessionId });
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
            <Ionicons
              name="cube"
              size={48}
              color={colors.primaryForeground}
            />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            POCKET<Text style={{ color: colors.primary }}>CHECK</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Double-check your pockets before you step out! Create packing lists
            for work, the gym, or custom routines.
          </Text>
        </View>

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Dynamic Auth Views */}
        {mode === "welcome" ? (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setErrorMsg("");
                setMode("login");
              }}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                LOG IN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnOutline,
                { borderColor: colors.border },
              ]}
              onPress={() => {
                setErrorMsg("");
                setMode("signup");
              }}
            >
              <Text style={[styles.btnText, { color: colors.foreground }]}>
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>
        ) : pendingVerification ? (
          <View style={styles.form}>
            <Text style={[styles.formHeader, { color: colors.foreground }]}>
              Verify your email
            </Text>
            <Text style={[styles.formSub, { color: colors.mutedForeground }]}>
              Enter the verification code sent to {emailAddress}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Verification Code"
              placeholderTextColor={colors.mutedForeground}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.btnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  VERIFY EMAIL
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              value={emailAddress}
              onChangeText={setEmailAddress}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={mode === "login" ? handleSignIn : handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.btnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  {mode === "login" ? "LOG IN" : "CREATE ACCOUNT"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignSelf: "center", marginTop: 8 }}
              onPress={() => {
                setErrorMsg("");
                setMode(mode === "login" ? "signup" : "login");
              }}
            >
              <Text
                style={[styles.switchText, { color: colors.mutedForeground }]}
              >
                {mode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Log in"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Github Link */}
        <TouchableOpacity
          style={[
            styles.githubBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() =>
            Linking.openURL("https://github.com/YogaDharma21/pocket-check")
          }
        >
          <Ionicons name="git-branch" size={16} color={colors.primary} />
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
    marginTop: 40,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 20,
  },
  form: {
    gap: 12,
    marginBottom: 20,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: "800",
  },
  formSub: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "600",
  },
  btn: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutline: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  switchText: {
    fontSize: 13,
    fontWeight: "700",
  },
  githubBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  githubText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
