"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { showIcareSuccessToast } from "@/components/shared/icare-toast";
import type { AssistantProfile } from "./assistantAccount.types";
import {
  assistantProfileEditSchema,
  profileToEditValues,
  type AssistantProfileEditValues,
} from "./assistantAccount.schema";

const PROFILE_QUERY_KEY = ["assistant", "account", "profile"] as const;

function mergeProfile(
  current: AssistantProfile,
  values: AssistantProfileEditValues,
): AssistantProfile {
  const parsed = assistantProfileEditSchema.parse(values);
  const avatarUrl = parsed.avatarUrl?.trim() ? parsed.avatarUrl.trim() : null;

  return {
    ...current,
    fullName: parsed.fullName,
    email: parsed.email,
    phone: parsed.phone,
    department: parsed.department,
    experienceYears: parsed.experienceYears,
    avatarUrl,
  };
}

export function useAssistantAccountProfile(initialProfile: AssistantProfile) {
  const [profile, setProfile] = useState(initialProfile);
  const [editOpen, setEditOpen] = useState(false);

  const { mutateAsync: saveProfile, isPending: isSaving } = useMutation({
    mutationKey: [...PROFILE_QUERY_KEY, "update"],
    mutationFn: async (values: AssistantProfileEditValues) => {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return values;
    },
    onSuccess: (values) => {
      setProfile((current) => mergeProfile(current, values));
      showIcareSuccessToast("Profile updated", "Your account details were saved.");
      setEditOpen(false);
    },
  });

  return {
    profile,
    editOpen,
    setEditOpen,
    saveProfile,
    isSaving,
    editDefaults: profileToEditValues(profile),
  };
}
