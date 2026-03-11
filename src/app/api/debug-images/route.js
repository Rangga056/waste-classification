import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data } = supabaseAdmin.storage.from("waste-images").getPublicUrl("test.jpg");
    
    let fetchStatus = 0;
    let fetchContentType = "";
    let fetchText = "";

    try {
      const res = await fetch(data.publicUrl);
      fetchStatus = res.status;
      fetchContentType = res.headers.get("content-type");
      fetchText = await res.text();
    } catch (err) {
      fetchText = err.message;
    }

    return NextResponse.json({
        url: data.publicUrl,
        fetchStatus,
        fetchContentType,
        fetchText: fetchText.slice(0, 100)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
