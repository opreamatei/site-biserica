import bookings from "./bookings";
import priestNotifications from "./priestNotifications";
import user from "./user";
import program, { programActivity, programDay } from "./program";
import spovInterval from "./spovInterval";


export const schema = {
  types: [
    bookings,
    priestNotifications,
    user,
    programActivity,
    programDay,
    program,
    spovInterval,
  ],
}
