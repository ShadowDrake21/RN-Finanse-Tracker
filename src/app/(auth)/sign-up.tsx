import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';
import SocialButton from '@/components/SocialButton';
import CustomButton from '@/components/CustomButton';
import { useOAuth, useSignUp } from '@clerk/clerk-expo';
import { useForm, Controller } from 'react-hook-form';
import CustomTextInput from '@/components/CustomTextInput';
import FormError from '@/components/FormError';
import { STYLES } from '@/constants/styles';

interface IFormInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Page = () => {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const { startOAuthFlow: googleOAuth } = useOAuth({
    strategy: 'oauth_google',
  });
  const { startOAuthFlow: appleOAuth } = useOAuth({
    strategy: 'oauth_apple',
  });

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSignUp = async () => {
    if (!isLoaded) return;

    try {
      const { name, email, password } = getValues();
      !!name.split(' ')[1]
        ? await signUp.create({
            firstName: name.split(' ')[0],
            lastName: name.split(' ')[1] || '',
            emailAddress: email,
            password,
          })
        : await signUp.create({
            firstName: name.split(' ')[0],
            emailAddress: email,
            password,
          });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Whoops!', err.message, [{ text: 'OK, got it' }]);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Whoops!', 'Something went wrong!', [
          { text: 'OK, got it' },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Whoops!', err.message, [{ text: 'OK, got it' }]);
    }
  };

  const onSocialAuth = React.useCallback(async (type: 'google' | 'apple') => {
    try {
      const { createdSessionId, setActive } =
        type === 'google' ? await googleOAuth() : await appleOAuth();

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Whoops!', 'Something went wrong! Try once again!', [
          { text: 'OK, got it' },
        ]);
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.main }}
      contentContainerStyle={{
        flex: 1,
        paddingHorizontal: 25,
        justifyContent: 'center',
        backgroundColor: COLORS.main,
      }}
    >
      {pendingVerification ? (
        <>
          <View style={{ marginBottom: 20, gap: 15 }}>
            <Text
              style={{
                fontWeight: '800',
                fontSize: 34,
                letterSpacing: 0.4,
              }}
            >
              Verify Your Email
            </Text>
            <Text
              style={{
                fontWeight: '600',
                fontSize: 22,
                letterSpacing: 0.5,
              }}
            >
              We've sent a verification code to your email address.
            </Text>
          </View>
          <CustomTextInput
            value={code}
            autoFocus
            placeholder="Enter your verification code"
            propStyles={{ marginBottom: 20 }}
            placeholderTextColor={COLORS.placeholder}
            keyboardType="number-pad"
            onChangeText={setCode}
          />
          <CustomButton text="Verify" onPress={onVerifyPress} />
        </>
      ) : (
        <>
          <View style={{ marginBottom: 50, gap: 15 }}>
            <Text style={STYLES.authTitle}>
              Start Your Journey to Financial Freedom
            </Text>
            <Text style={STYLES.authSubtitle}>
              Register today and take control of your financial future.
            </Text>
          </View>
          <KeyboardAvoidingView
            style={{ gap: 15, marginBottom: 20 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
          >
            <Controller
              control={control}
              rules={{
                required: true,
                maxLength: 50,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  autoFocus
                  placeholder="Name"
                  onChangeText={onChange}
                  autoCapitalize="words"
                  value={value}
                  onBlur={onBlur}
                />
              )}
              name="name"
            />
            {errors.name && (
              <>
                {errors.name.type === 'required' && (
                  <FormError>Name is required.</FormError>
                )}
                {errors.name.type === 'maxLength' && (
                  <FormError>
                    Name cannot be longer than 50 characters.
                  </FormError>
                )}
              </>
            )}

            <Controller
              control={control}
              rules={{
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  placeholder="Email"
                  onChangeText={onChange}
                  value={value}
                  onBlur={onBlur}
                />
              )}
              name="email"
            />
            {errors.email && (
              <>
                {errors.email.type === 'required' && (
                  <FormError>Email is required.</FormError>
                )}
                {errors.email.type === 'pattern' && (
                  <FormError>This is not a valid email address.</FormError>
                )}
              </>
            )}

            <Controller
              control={control}
              rules={{
                required: true,
                minLength: 8,
                maxLength: 25,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  placeholder="Password"
                  onChangeText={onChange}
                  value={value}
                  onBlur={onBlur}
                  secureTextEntry={true}
                />
              )}
              name="password"
            />
            {errors.password && (
              <>
                {errors.password.type === 'required' && (
                  <FormError>Password is required.</FormError>
                )}
                {errors.password.type === 'minLength' && (
                  <FormError>
                    Password must be at least 8 characters long.
                  </FormError>
                )}
                {errors.password.type === 'maxLength' && (
                  <FormError>
                    Password cannot be longer than 25 characters.
                  </FormError>
                )}
              </>
            )}

            <Controller
              control={control}
              rules={{
                required: true,
                validate: (value) => {
                  return (
                    value === getValues('password') || 'Passwords do not match.'
                  );
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  placeholder="Confirm Password"
                  onChangeText={onChange}
                  value={value}
                  onBlur={onBlur}
                  secureTextEntry={true}
                />
              )}
              name="confirmPassword"
            />
            {errors.confirmPassword && (
              <>
                {errors.confirmPassword.type === 'required' && (
                  <FormError>Confirm Password is required.</FormError>
                )}
                {errors.confirmPassword.type === 'validate' && (
                  <FormError>{errors.confirmPassword.message!}</FormError>
                )}
              </>
            )}

            <CustomButton onPress={handleSubmit(onSignUp)} text="Sign Up" />
          </KeyboardAvoidingView>

          <View style={styles.separatorContainer}>
            <View style={styles.separator} />
            <Text style={styles.separatorText}>or</Text>
            <View style={styles.separator} />
          </View>
          <View style={styles.socialContainer}>
            <SocialButton
              icon="google"
              label="Sign Up with "
              onPress={() => onSocialAuth('google')}
            />
            <SocialButton
              icon="apple1"
              label="Sign Up with "
              onPress={() => onSocialAuth('apple')}
            />
          </View>

          <View
            style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}
          >
            <Text style={{ fontWeight: '600', alignSelf: 'center' }}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.replace('/sign-in')}>
              <Text style={{ fontWeight: '600', color: COLORS.primary }}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default Page;

const styles = StyleSheet.create({
  separatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 25,
  },
  separator: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#000',
  },
  separatorText: { marginHorizontal: 10, fontWeight: '700', fontSize: 16 },
  socialContainer: {
    gap: 15,
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
