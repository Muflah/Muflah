import type { TransactionalEmailType } from "./connector";

export function senderAddress(type: TransactionalEmailType, domain: string): string {
  return `auth-${type}@${domain}`;
}
