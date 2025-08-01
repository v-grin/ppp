/** @decorator */

import { observable } from '../lib/fast/observable.js';
import { TRADER_DATUM } from './const.js';
import { $throttle, $debounce } from './ppp-decorators.js';

export class ConditionalOrder {
  $throttle;

  $debounce;

  mainTrader;

  instrument;

  side;

  payload;

  @observable
  status;

  placedAt;

  orderId;

  sourceID;

  sourceIDCounter = 0;

  constructor(mainTrader, throttleTime = 250) {
    this.$throttle ??= $throttle;
    this.$debounce ??= $debounce;
    this.mainTrader = mainTrader;
    this.orderId = this.mainTrader.nextConditionalOrderId();
    this.sourceID ??= this.nextSourceID();

    this.changedWithThrottle = $throttle(this.changed, throttleTime);
  }

  nextSourceID() {
    return `O${++this.sourceIDCounter}`;
  }

  traderEvent(data = {}) {
    return this.mainTrader.traderEvent(data);
  }

  statusChanged() {
    return this.changed();
  }

  changed(options) {
    return this.mainTrader.datums?.[
      TRADER_DATUM.CONDITIONAL_ORDER
    ]?.dataArrived?.(this.serialize(), options);
  }

  place({ instrument, direction, payload }) {
    this.instrument ??= instrument;
    this.side ??= direction;
    this.payload ??= payload;
    this.placedAt ??= new Date().toISOString();
    this.lastPlacedAt = new Date().toISOString();
    this.status ??= 'inactive';
  }

  cancel() {
    this.status = 'canceled';
  }

  serialize() {
    return {
      instrument: this.instrument,
      side: this.side,
      payload: this.payload,
      placedAt: this.placedAt,
      lastPlacedAt: this.lastPlacedAt,
      sourceID: this.sourceID,
      orderId: this.orderId,
      status: this.status,
      isConditionalOrder: true
    };
  }
}

export function pppOrderInstanceForWorkerIs(instance) {
  if (typeof process !== 'undefined' && process.release.name === 'node') {
    // Aspirant Worker related section.
    globalThis.pppOrderInstanceForWorkerRecv?.(instance);
  }
}
