export default function PitaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // PITA presentations have their own full-screen layout - no platform shell
  return <>{children}</>;
}
