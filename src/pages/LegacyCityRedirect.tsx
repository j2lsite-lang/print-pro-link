import { Navigate, useParams } from "react-router-dom";
import pages from "@/seo/generated/pages.json";
import NotFound from "./NotFound";

const cityAliases: Record<string, string> = {
  "les-sables-d-olonne": "les-sables-dolonne",
  "mayenne-ville": "mayenne",
};

export default function LegacyCityRedirect() {
  const { slug = "" } = useParams();
  const target = `/ville/${cityAliases[slug] || slug}`;
  return Object.prototype.hasOwnProperty.call(pages, target) ? <Navigate to={target} replace /> : <NotFound />;
}