import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState } from 'react';

import { Brand } from '@/components/skop/Brand';
import { SkopButton } from '@/components/skop/SkopButton';
import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';
import { type SpendPeriod, useSkopSession } from '@/context/skop-session';

const spendPeriods: { label: string; value: SpendPeriod }[] = [
  { label: 'DAILY', value: 'daily' },
  { label: 'WEEKLY', value: 'weekly' },
  { label: 'MONTHLY', value: 'monthly' },
];

const dayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1));
const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));
const yearOptions = Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) =>
  String(new Date().getFullYear() - index)
);

export default function OnboardingScreen() {
  const { completeOnboarding } = useSkopSession();
  const today = new Date();

  // the two steps share these values while the user moves between them
  const [step, setStep] = useState<1 | 2>(1);
  const [day, setDay] = useState(String(today.getDate()));
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [spendPeriod, setSpendPeriod] = useState<SpendPeriod>('daily');
  const [spendAmount, setSpendAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // step one checks that the date exists and is not in the future
  const continueToSpend = () => {
    setErrorMessage('');
    const quitDate = parseDate(day, month, year);

    if (!quitDate) {
      setErrorMessage('Enter a valid quit date.');
      return;
    }

    if (quitDate > startOfDay(new Date())) {
      setErrorMessage('Your quit date cannot be in the future.');
      return;
    }

    setStep(2);
  };

  // the saved shape matches the fields that will move into firestore
  const finishOnboarding = async () => {
    const amount = Number(spendAmount.replace(',', '.'));
    const quitDate = parseDate(day, month, year);
    setErrorMessage('');

    if (!quitDate) {
      setStep(1);
      setErrorMessage('Enter a valid quit date.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMessage('Enter a spend amount above R0.');
      return;
    }

    setSaving(true);
    try {
      await completeOnboarding({
        quitDate: dateToInputValue(quitDate),
        spendPeriod,
        spendAmount: Math.round(amount * 100) / 100,
      });
    } catch {
      setErrorMessage('Your setup could not be saved. Please try again.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardArea}>
        <ScrollView
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <Brand compact />
            <View style={styles.stepBlock}>
              <Text style={styles.stepText}>{step} OF 2</Text>
              <View style={styles.progressRail}>
                <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
              </View>
            </View>
          </View>

          <View style={styles.form}>
            {step === 1 ? (
              <>
                <View>
                  <Text style={styles.title}>WHEN DID YOU QUIT?</Text>
                  <Text style={styles.bodyText}>This sets your smoke-free streak.</Text>
                </View>

                {/* each dropdown also has a text field for typing the date */}
                <View style={styles.dateRow}>
                  <DateDropdown
                    label="DAY"
                    maxLength={2}
                    options={dayOptions}
                    value={day}
                    onChangeText={setDay}
                  />
                  <DateDropdown
                    label="MONTH"
                    maxLength={2}
                    options={monthOptions}
                    value={month}
                    onChangeText={setMonth}
                  />
                  <DateDropdown
                    label="YEAR"
                    maxLength={4}
                    options={yearOptions}
                    value={year}
                    onChangeText={setYear}
                    wide
                  />
                </View>
              </>
            ) : (
              <>
                <View>
                  <Text style={styles.title}>WHAT DID SMOKING COST?</Text>
                  <Text style={styles.bodyText}>Choose the time period you used for this amount.</Text>
                </View>

                {/* each option saves a value used by the money calculation */}
                <View style={styles.periodRow}>
                  {spendPeriods.map((period) => {
                    const selected = period.value === spendPeriod;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={period.value}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setSpendPeriod(period.value);
                        }}
                        style={({ pressed }) => [
                          styles.periodButton,
                          selected && styles.periodButtonSelected,
                          pressed && styles.buttonPressed,
                        ]}>
                        <Text style={[styles.periodText, selected && styles.periodTextSelected]}>{period.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.amountBlock}>
                  <Text style={styles.fieldLabel}>{spendPeriod.toUpperCase()} SPEND</Text>
                  <View style={styles.amountInputWrap}>
                    <Text style={styles.currency}>R</Text>
                    <TextInput
                      editable={!saving}
                      keyboardType="decimal-pad"
                      onChangeText={(value) => setSpendAmount(value.replace(/[^0-9.,]/g, ''))}
                      placeholder="0.00"
                      placeholderTextColor={SkopColors.muted}
                      style={styles.amountInput}
                      value={spendAmount}
                    />
                  </View>
                </View>
              </>
            )}

            {!!errorMessage && (
              <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                {errorMessage}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            {step === 2 && <SkopButton disabled={saving} label="BACK" onPress={() => setStep(1)} />}
            <SkopButton
              disabled={saving}
              label={saving ? 'SAVING...' : step === 1 ? 'CONTINUE' : 'START SKOP'}
              onPress={step === 1 ? continueToSpend : finishOnboarding}
              variant="green"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DateDropdown({
  label,
  maxLength,
  options,
  value,
  onChangeText,
  wide,
}: {
  label: string;
  maxLength: number;
  options: string[];
  value: string;
  onChangeText: (value: string) => void;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const lastScrollNotch = useRef(0);
  const filteredOptions =
    draft === value ? options : options.filter((option) => !draft || option.startsWith(draft));

  // the field opens a list but keeps a typed value when the user presses done
  const openDropdown = () => {
    setDraft(value);
    lastScrollNotch.current = 0;
    void Haptics.selectionAsync();
    setOpen(true);
  };

  const saveTypedValue = () => {
    void Haptics.selectionAsync();
    onChangeText(draft);
    setOpen(false);
  };

  // one selection tap plays each time scrolling crosses an option row
  const handleOptionScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextNotch = Math.round(event.nativeEvent.contentOffset.y / 44);
    if (nextNotch === lastScrollNotch.current) return;

    lastScrollNotch.current = nextNotch;
    void Haptics.selectionAsync();
  };

  return (
    <View style={[styles.dateField, wide && styles.yearField]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
        accessibilityRole="button"
        onPress={openDropdown}
        style={({ pressed }) => [styles.dateDropdown, pressed && styles.buttonPressed]}>
        <Text numberOfLines={1} style={styles.dateValue}>
          {value}
        </Text>
        <Ionicons name="chevron-down" size={21} color={SkopColors.ink} />
      </Pressable>

      {open && (
        <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}>
            <Pressable onPress={() => setOpen(false)} style={styles.modalBackdrop}>
              <Pressable onPress={(event) => event.stopPropagation()} style={styles.dropdownDialog}>
                <View style={styles.dropdownHeading}>
                  <Text style={styles.dropdownTitle}>CHOOSE {label}</Text>
                  <Pressable
                    accessibilityLabel="Close dropdown"
                    hitSlop={10}
                    onPress={() => setOpen(false)}
                    style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={SkopColors.ink} />
                  </Pressable>
                </View>

                <TextInput
                  autoFocus
                  keyboardType="number-pad"
                  maxLength={maxLength}
                  onChangeText={(nextValue) => setDraft(nextValue.replace(/\D/g, ''))}
                  selectTextOnFocus
                  style={styles.dropdownInput}
                  value={draft}
                />

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  onScroll={handleOptionScroll}
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}
                  style={styles.optionList}>
                  {filteredOptions.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        onChangeText(option);
                        setOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.optionButton,
                        option === value && styles.optionButtonSelected,
                        pressed && styles.optionButtonPressed,
                      ]}>
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable
                  accessibilityRole="button"
                  onPress={saveTypedValue}
                  style={({ pressed }) => [styles.doneButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.doneButtonText}>DONE</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

function parseDate(dayValue: string, monthValue: string, yearValue: string) {
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);
  const date = new Date(year, month - 1, day);

  if (
    year < 1900 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return startOfDay(date);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateToInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SkopColors.background },
  keyboardArea: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  stepBlock: { flex: 1, maxWidth: 220, gap: 8 },
  stepText: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 14,
    textAlign: 'right',
  },
  progressRail: {
    height: 8,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    backgroundColor: SkopColors.surface,
  },
  progressFill: { height: '100%', backgroundColor: SkopColors.green },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: 34,
    paddingVertical: 36,
  },
  title: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 34,
    textAlign: 'center',
  },
  bodyText: {
    marginTop: 8,
    color: SkopColors.ink,
    fontFamily: SkopFonts.body,
    fontSize: 17,
    textAlign: 'center',
  },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1, gap: 7 },
  yearField: { flex: 1.35 },
  fieldLabel: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 15,
  },
  dateDropdown: {
    height: 64,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: SkopColors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...skopShadow,
  },
  dateValue: {
    flex: 1,
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 25,
    textAlign: 'center',
  },
  modalKeyboard: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    padding: 24,
    backgroundColor: 'rgba(33,23,18,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownDialog: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '72%',
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: SkopColors.background,
    padding: 18,
    ...skopShadow,
  },
  dropdownHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dropdownTitle: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 21,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownInput: {
    height: 54,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: SkopColors.surface,
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 22,
    paddingHorizontal: 14,
    textAlign: 'center',
  },
  optionList: {
    marginTop: 12,
    marginBottom: 14,
  },
  optionButton: {
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: SkopColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonSelected: {
    backgroundColor: SkopColors.yellow,
  },
  optionButtonPressed: {
    backgroundColor: SkopColors.green,
  },
  optionText: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 18,
  },
  doneButton: {
    height: 48,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: SkopColors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...skopShadow,
  },
  doneButtonText: {
    color: SkopColors.surface,
    fontFamily: SkopFonts.bold,
    fontSize: 17,
  },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodButton: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: SkopColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...skopShadow,
  },
  periodButtonSelected: {
    backgroundColor: SkopColors.yellow,
  },
  periodText: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 14,
  },
  periodTextSelected: { color: SkopColors.ink },
  buttonPressed: { transform: [{ translateY: 3 }] },
  amountBlock: { gap: 7 },
  amountInputWrap: {
    height: 72,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: SkopColors.surface,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 28,
  },
  amountInput: {
    flex: 1,
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 28,
    paddingHorizontal: 8,
  },
  errorText: {
    color: '#b42318',
    fontFamily: SkopFonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    height: 82,
    flexDirection: 'row',
    gap: 14,
  },
});
