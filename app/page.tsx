import Link from "next/link";
import Container from "./components/container";
import { Button } from "./components/ui/button";

export default function Home() {
  return (
    <Container>
      <h1>Hello</h1>
      <div className="">This is a Site map Generator</div>
      <div className="flex gap-3 mt-4">
        <Button asChild size="lg">
          <Link href="/">Home</Link>
        </Button>
        <Button size="lg" variant="secondary">
          Button Component
        </Button>
      </div>
    </Container>
  );
}
