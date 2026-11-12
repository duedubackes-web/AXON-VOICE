import {NextResponse} from "next/server";
import {providerConfigured} from "@/lib/voice";
export const dynamic="force-dynamic";
export function GET(){return NextResponse.json({status:"ok",ttsConfigured:providerConfigured(),version:"0.1.0"},{headers:{"Cache-Control":"no-store"}});}
