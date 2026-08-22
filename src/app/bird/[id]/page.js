import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import BirdDetail from "@/component/BirdDetail";

export const revalidate = 60;

async function getBird(id) {
  try {
    const { data } = await supabase
      .from("birds")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const bird = await getBird(id);
  if (!bird) return { title: "Burung Tidak Ditemukan" };

  const description = `${bird.name} (${bird.species}) tersedia di Kicaw Mania. Burung sehat, berkualitas, dengan garansi kesehatan 7 hari.`;
  return {
    title: `${bird.name} — ${bird.species}`,
    description,
    openGraph: {
      title: `${bird.name} | Kicaw Mania`,
      description,
      images: bird.image_url ? [{ url: bird.image_url }] : undefined,
    },
  };
}

export default async function BirdPage({ params }) {
  const { id } = await params;
  const bird = await getBird(id);
  if (!bird) notFound();

  return <BirdDetail bird={bird} />;
}
