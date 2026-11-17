export interface SmsSender {
  send(phone: string, message: string): Promise<void>;
}

/** Development sender: prints the message instead of sending it. Replace with a real provider. */
export const consoleSmsSender: SmsSender = {
  async send(phone, message) {
    console.log(`[sms] to ${phone}: ${message}`);
  },
};
