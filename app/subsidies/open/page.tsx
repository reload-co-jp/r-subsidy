import { StatusListPage, statusPageMetadata } from "../status-list-page"

export const metadata = statusPageMetadata("open")

export default function Page() {
  return <StatusListPage status="open" />
}
