import type { Status } from "../../lib/types"

export const STATUS_LABEL: Record<Status, string> = {
  open: "受付中",
  upcoming: "公募予定",
  closed: "受付終了",
  unknown: "要確認",
}

// 色だけに頼らず、記号（CSS ::before）とテキストで区別する
export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status] ?? STATUS_LABEL.unknown}</span>
}
