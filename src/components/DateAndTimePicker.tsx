interface DateAndTimePickerProps {
  formId: string;
  initialDate: string;
  initialTime: string;
}

export const DateAndTimePicker = ({
  formId,
  initialDate,
  initialTime,
}: DateAndTimePickerProps) => {
  return (
    <>
      <div class="group relative mb-6 w-full">
        <input
          type="date"
          value={initialDate}
          form={formId}
          name="date_played"
          id="date_played"
          class="peer block w-full appearance-none border-0 border-b-2 border-gray-600 bg-transparent px-0 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
          placeholder=" "
        />
        <label
          for="date_played"
          class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
        >
          Date played
        </label>
      </div>
      <div class="group relative mb-6 w-full">
        <input
          type="time"
          value={initialTime}
          form={formId}
          name="time_played"
          id="time_played"
          class="peer block w-full appearance-none border-0 border-b-2 border-gray-600 bg-transparent px-0 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
          placeholder=" "
        />
        <label
          for="time_played"
          class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
        >
          Time played
        </label>
      </div>
    </>
  );
};
