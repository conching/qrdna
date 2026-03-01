"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import type { QRContentType } from "@/lib/qr/types";
import type { ComponentType } from "react";

import { URLForm } from "./url-form";
import { TextForm } from "./text-form";
import { EmailForm } from "./email-form";
import { PhoneForm } from "./phone-form";
import { SMSForm } from "./sms-form";
import { WiFiForm } from "./wifi-form";
import { VCardForm } from "./vcard-form";
import { GeoForm } from "./geo-form";
import { EventForm } from "./event-form";
import { AppStoreForm } from "./app-store-form";

const formMap: Record<QRContentType, ComponentType> = {
  url: URLForm,
  text: TextForm,
  email: EmailForm,
  phone: PhoneForm,
  sms: SMSForm,
  wifi: WiFiForm,
  vcard: VCardForm,
  geo: GeoForm,
  event: EventForm,
  app_store: AppStoreForm,
};

export function QRDataForm() {
  const contentType = useQREditorStore((s) => s.contentType);
  const Form = formMap[contentType];
  if (!Form) return null;
  return <Form />;
}

export {
  URLForm,
  TextForm,
  EmailForm,
  PhoneForm,
  SMSForm,
  WiFiForm,
  VCardForm,
  GeoForm,
  EventForm,
  AppStoreForm,
};
