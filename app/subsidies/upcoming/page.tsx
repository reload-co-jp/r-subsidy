import { StatusListPage, statusPageMetadata } from "../status-list-page"

export const metadata = statusPageMetadata("upcoming")

export default function Page() {
  return <StatusListPage status="upcoming" />
}
