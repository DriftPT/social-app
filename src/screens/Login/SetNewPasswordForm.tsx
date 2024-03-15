import React, {useState, useEffect} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {BskyAgent} from '@atproto/api'
import {useAnalytics} from 'lib/analytics/analytics'

import {isNetworkError} from 'lib/strings/errors'
import {cleanError} from 'lib/strings/errors'
import {checkAndFormatResetCode} from 'lib/strings/password'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {FormContainer} from './FormContainer'
import {Text} from '#/components/Typography'
import * as TextField from '#/components/forms/TextField'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Button, ButtonText} from '#/components/Button'
import {useTheme, atoms as a} from '#/alf'
import {FormError} from './FormError'

export const SetNewPasswordForm = ({
  error,
  serviceUrl,
  setError,
  onPressBack,
  onPasswordSet,
}: {
  error: string
  serviceUrl: string
  setError: (v: string) => void
  onPressBack: () => void
  onPasswordSet: () => void
}) => {
  const {screen} = useAnalytics()
  const {_} = useLingui()
  const t = useTheme()

  useEffect(() => {
    screen('Signin:SetNewPasswordForm')
  }, [screen])

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [resetCode, setResetCode] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const onPressNext = async () => {
    // Check that the code is correct. We do this again just incase the user enters the code after their pw and we
    // don't get to call onBlur first
    const formattedCode = checkAndFormatResetCode(resetCode)
    // TODO Better password strength check
    if (!formattedCode || !password) {
      setError(
        _(
          msg`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
        ),
      )
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      const agent = new BskyAgent({service: serviceUrl})
      await agent.com.atproto.server.resetPassword({
        token: formattedCode,
        password,
      })
      onPasswordSet()
    } catch (e: any) {
      const errMsg = e.toString()
      logger.warn('Failed to set new password', {error: e})
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(cleanError(errMsg))
      }
    }
  }

  const onBlur = () => {
    const formattedCode = checkAndFormatResetCode(resetCode)
    if (!formattedCode) {
      setError(
        _(
          msg`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
        ),
      )
      return
    }
    setResetCode(formattedCode)
  }

  return (
    <FormContainer
      testID="setNewPasswordForm"
      title={<Trans>Set new password</Trans>}>
      <Text>
        <Trans>
          You will receive an email with a "reset code." Enter that code here,
          then enter your new password.
        </Trans>
      </Text>

      <View>
        <TextField.Label>Reset code</TextField.Label>
        <TextField.Root>
          <TextField.Icon icon={Ticket} />
          <TextField.Input
            testID="resetCodeInput"
            label={_(msg`Looks like XXXXX-XXXXX`)}
            autoCapitalize="none"
            autoFocus={true}
            autoCorrect={false}
            autoComplete="off"
            value={resetCode}
            onChangeText={setResetCode}
            onFocus={() => setError('')}
            onBlur={onBlur}
            editable={!isProcessing}
            accessibilityHint={_(
              msg`Input code sent to your email for password reset`,
            )}
          />
        </TextField.Root>
      </View>

      <View>
        <TextField.Label>New password</TextField.Label>
        <TextField.Root>
          <TextField.Icon icon={Lock} />
          <TextField.Input
            testID="newPasswordInput"
            label={_(msg`Enter a password`)}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            returnKeyType="done"
            secureTextEntry={true}
            textContentType="password"
            clearButtonMode="while-editing"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onPressNext}
            editable={!isProcessing}
            accessibilityHint={_(msg`Input new password`)}
          />
        </TextField.Root>
      </View>
      <FormError error={error} />
      <View style={[a.flex_row, a.align_center]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="small"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {isProcessing ? (
          <ActivityIndicator />
        ) : (
          <Button
            label={_(msg`Next`)}
            variant="solid"
            color="primary"
            size="small"
            onPress={onPressNext}>
            <ButtonText>
              <Trans>Next</Trans>
            </ButtonText>
          </Button>
        )}
        {isProcessing ? (
          <Text style={[t.atoms.text_contrast_high, a.pl_md]}>
            <Trans>Updating...</Trans>
          </Text>
        ) : undefined}
      </View>
    </FormContainer>
  )
}
