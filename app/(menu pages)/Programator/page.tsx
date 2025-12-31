import HomeClient from "./home-client";
import { getEvents, getPriests } from "@/lib/events";

export default function Home() {
  const priests = getPriests();
  const defaultPriest = priests[0]?.id;
  const events = getEvents(defaultPriest);

  return <HomeClient availability={events} priests={priests} />;
}
