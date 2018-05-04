/* Purpose: Given a clinician shift, it composes a list of default items to show on the composeTimelineItems
            notice that there are two main types of shifts here.

            One with the className='disabledBlock': this will be displayed in the timeline as the clinician shift,
                                        it is not editable, wheres the other is a default item so that the user
                                        doesn't need to click on it.
*/
function composeTimelineItems(shift){
  return [
  {
    // id: new chance().zip(),
    group: shift.userId,
    start_time : shift.first_start,
    end_time : shift.first_end,
    title: shift.first_start_string + ' - ' + shift.first_end_string,
  },
  {
    // id: new chance().zip(),
    group: shift.userId,
    start_time : shift.second_start,
    end_time : shift.second_end,
    title: shift.second_start_string + ' - ' + shift.second_end_string,
  },
  {
    // id: new chance().zip(),
    group: shift.userId,
    start_time : shift.first_start,
    end_time : shift.first_end,
    title: shift.first_start_string + ' - ' + shift.first_end_string,
    className : 'disabledBlock',
    canMove : false,
  },
  {
    // id: new chance().zip(),
    group: shift.userId,
    start_time : shift.second_start,
    end_time : shift.second_end,
    title: shift.second_start_string + ' - ' + shift.second_end_string,
    className : 'disabledBlock',
    canMove : false,
  },
  ]
}

module.exports = {
  composeTimelineItems: composeTimelineItems,
}
