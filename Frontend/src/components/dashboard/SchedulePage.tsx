import { Calendar, type CalendarProps } from "antd"
import { createStyles } from "antd-style"
import type { Dayjs } from "dayjs"


const useStyles = createStyles(({ token }) => ({
  root: {
    padding: 10,
    backgroundColor: token.colorPrimaryBg
  }
}))

const stylesFn: CalendarProps<Dayjs>['styles'] = (info) => {
  if (info.props.fullscreen) {
    return {
      root: {
        border: '2px solid #BD3C3',
        borderRadius: 10,
        backgroundColor: 'rgba(189,227,195,0.3)'
      }
    } satisfies CalendarProps<Dayjs>['styles']
  }
}

const SchedulePage = () => {
  const { styles: classNames } = useStyles()
  return (
    <Calendar classNames={classNames} styles={stylesFn} />
  )
}

export default SchedulePage