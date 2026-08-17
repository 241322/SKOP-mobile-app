import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import type { AgeGroup } from '@/lib/skop-domain';
import type { ProductType } from '@/lib/skop-firestore';

type PreAccountData = {
  ageGroup: AgeGroup | null;
  guardianConsentAt: string | null;
  guardianConsentVersion: number | null;
  guardianPinHash: string | null;
  guardianPinSalt: string | null;
  guardianRelationship: string | null;
  productType: ProductType | null;
};

type PreAccountContextValue = PreAccountData & {
  loading: boolean;
  readyForSignup: boolean;
  setAgeResult: (ageGroup: AgeGroup) => Promise<void>;
  setGuardianAttestation: (details: {
    consentAt: string;
    consentVersion: number;
    pinHash: string;
    pinSalt: string;
    relationship: string;
  }) => Promise<void>;
  setProductType: (productType: ProductType) => Promise<void>;
  clearPreAccount: () => Promise<void>;
};

const STORAGE_KEY = 'skop-pre-account';
const emptyData: PreAccountData = {
  ageGroup: null,
  guardianConsentAt: null,
  guardianConsentVersion: null,
  guardianPinHash: null,
  guardianPinSalt: null,
  guardianRelationship: null,
  productType: null,
};

const PreAccountContext = createContext<PreAccountContextValue | null>(null);

export function PreAccountProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PreAccountData>(emptyData);
  const [loading, setLoading] = useState(true);

  // only age and consent results are restored, never either date of birth
  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        const parsed = JSON.parse(value) as Partial<PreAccountData>;
        setData({
          ageGroup:
            parsed.ageGroup === 'under_13' || parsed.ageGroup === '13_17' || parsed.ageGroup === '18_plus'
              ? parsed.ageGroup
              : null,
          guardianConsentAt:
            typeof parsed.guardianConsentAt === 'string' ? parsed.guardianConsentAt : null,
          guardianConsentVersion:
            typeof parsed.guardianConsentVersion === 'number' ? parsed.guardianConsentVersion : null,
          guardianPinHash: typeof parsed.guardianPinHash === 'string' ? parsed.guardianPinHash : null,
          guardianPinSalt: typeof parsed.guardianPinSalt === 'string' ? parsed.guardianPinSalt : null,
          guardianRelationship:
            typeof parsed.guardianRelationship === 'string' ? parsed.guardianRelationship : null,
          productType:
            parsed.productType === 'cigarettes' || parsed.productType === 'vaping' || parsed.productType === 'both'
              ? parsed.productType
              : null,
        });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const save = async (next: PreAccountData) => {
    setData(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const value = useMemo<PreAccountContextValue>(
    () => ({
      ...data,
      loading,
      readyForSignup:
        Boolean(data.productType) &&
        (data.ageGroup === '18_plus' ||
          (data.ageGroup === '13_17' &&
            Boolean(data.guardianConsentAt) &&
            data.guardianConsentVersion === 1 &&
            Boolean(data.guardianPinHash) &&
            Boolean(data.guardianPinSalt) &&
            Boolean(data.guardianRelationship))),
      setProductType: async (productType) => save({ ...data, productType }),
      setAgeResult: async (ageGroup) =>
        save({
          ...data,
          ageGroup,
          guardianConsentAt: null,
          guardianConsentVersion: null,
          guardianPinHash: null,
          guardianPinSalt: null,
          guardianRelationship: null,
        }),
      setGuardianAttestation: async ({ consentAt, consentVersion, pinHash, pinSalt, relationship }) =>
        save({
          ...data,
          guardianConsentAt: consentAt,
          guardianConsentVersion: consentVersion,
          guardianPinHash: pinHash,
          guardianPinSalt: pinSalt,
          guardianRelationship: relationship,
        }),
      clearPreAccount: async () => {
        setData(emptyData);
        await AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    [data, loading],
  );

  return <PreAccountContext.Provider value={value}>{children}</PreAccountContext.Provider>;
}

export function usePreAccount() {
  const value = useContext(PreAccountContext);
  if (!value) throw new Error('usePreAccount must be used inside PreAccountProvider');
  return value;
}
