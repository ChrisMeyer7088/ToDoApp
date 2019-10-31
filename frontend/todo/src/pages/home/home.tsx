import React from 'react';
import { Redirect } from 'react-router-dom';
import { getUserNotices } from '../../services/infoRequests';
import './home.css';
import Header from '../../components/header/header';
import HamburgerMenu from '../../components/hamburgerMenu/hamburgerMenu';
import { getUniqueId } from '../../services/addNotice';
import { Notice } from '../../interfaces/requests';

interface State {
    userId: string,
    token: string,
    redirectToLogin: boolean,
    selectedDate: Date,
    eventMap: Map<string, Map<number, Notice[]>>
}

class HomePage extends React.Component<null, State> {
    private DATES: string[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    constructor(props: any) {
        super(props);
        this.state = {
            userId: "",
            token: localStorage.getItem("token") || "",
            redirectToLogin: false,
            selectedDate: new Date(),
            eventMap: new Map()
        }
    }

    render() {
        const { returnToLogin, renderCalendarDayHeaders, renderCalendarDays, setMonth } = this;
        const { redirectToLogin, token, selectedDate } = this.state

        if(redirectToLogin) {
            return (<Redirect to="/login"/>)
        }
        return (
            <div className="container-content">
                <HamburgerMenu />
                <div className="flex-container">
                    <Header selectedDate={selectedDate} token={token} returnToLogin={returnToLogin} 
                    setMonth={setMonth} />
                    <div className="container-calender">
                        <table id="calendar">
                            <tbody>
                                {renderCalendarDayHeaders()}
                                {renderCalendarDays()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    componentDidMount() {
        this.retrieveNotices();
    }


    //Renders CalendarDays using information from the selected days
    renderCalendarDays = () => {
        const { getFullCalendarDays, localDateToDisplayString, changeSelectedDate } = this;
        const { selectedDate } = this.state;

        let allDays: Date[] = getFullCalendarDays(selectedDate.getMonth(), selectedDate.getFullYear());

        //Splits the days into weekly increments to display in table rows
        let daysInWeekIncremenets: Date[][] = [[]];
        let rowIndex = 0;
        for(let index = 0; index < allDays.length; index++) {
            if(index % 7 === 0 && index !== 0) {
                daysInWeekIncremenets.push([])
                rowIndex++;
            }
            daysInWeekIncremenets[rowIndex].push(allDays[index]);
        }

        return (
            daysInWeekIncremenets.map(weekArr => {
                return (
                    <tr key={getUniqueId()}>
                        {weekArr.map(day => {
                            //Sets an id on the selected date
                            if(day.getMonth() === selectedDate.getMonth() && day.getDate() === selectedDate.getDate()) {
                                return (
                                    <td key={getUniqueId()} onClick={() => changeSelectedDate(day)} className="calendar-day" id="selected-day" >
                                        <div>
                                            <div className="container-day-number">{localDateToDisplayString(day)}</div>
                                        </div>
                                    </td>
                                )
                            } else {
                                return (
                                    <td key={getUniqueId()} onClick={() => changeSelectedDate(day)} className="calendar-day">
                                        <div>
                                            <div className="container-day-number">{localDateToDisplayString(day)}</div>
                                        </div>
                                    </td>
                                )
                            }
                        })}
                    </tr>
                )
            })
                   
        )
    }

    renderCalendarDayHeaders = () => {
        return (
                <tr className="calendar-row-dates">
                    {this.DATES.map(day => {
                        return (
                            <th key={getUniqueId()} className="calendar-header-dates">
                                <div>
                                    {day}
                                </div>
                            </th>
                        )
                    })}
                </tr>
        )
    }

    retrieveNotices = () => {
        getUserNotices(this.state.token, this.state.selectedDate)
            .then(res => {
                let notices = res.data.data.notices;
                let eventMap = this.state.eventMap;
                for(let i = 0; i < notices.length; i++) {
                    let beginDate = new Date(notices[i].begindate);
                    let month: string = (beginDate.getMonth() + 1).toString();
                    let year: string = beginDate.getFullYear().toString();
                    let day: string = beginDate.getDate().toString();
                    let idString = year + '-' + month;

                    // eventMap<string, dayMap<string, eventIdMap<number, Notice>>
                    let dayMap = eventMap.get(idString) || new Map();
                    let eventIdMap: Map<number, Notice> = dayMap.get(day) || new Map();
                    eventIdMap.set(notices[i].id, {
                        beginDate,
                        endDate: new Date(notices[i].enddate),
                        title: notices[i].title,
                        color: notices[i].color,
                        description: notices[i].description
                    })
                    dayMap.set(day, eventIdMap);
                    eventMap.set(idString, dayMap);
                }
                console.log(eventMap)
                this.setState({
                    eventMap
                })
            })
            .catch(err => {
                if(!err.response || !err.response.status) return;
                if(err.response.status === 401) {
                    this.returnToLogin();
                }
            })
    }

    returnToLogin = () => {
        localStorage.removeItem('token')
        this.setState({
            redirectToLogin: true
        })
    }

    changeSelectedDate = (newDate: Date) => {
        this.setState({
            selectedDate: newDate
        })
    }

    setMonth = (newMonth: number) => {
        let selectedDate: Date = this.state.selectedDate;
        selectedDate.setMonth(newMonth);
        this.setState({
            selectedDate
        })
    }

    private getDaysFromMonth = (month: number, year: number) => {
        let currentMonth = new Date(year, month, 1);
        let days: Date[] = [];
        while(currentMonth.getMonth() === month ) {
            days.push(new Date(currentMonth))
            currentMonth.setDate(currentMonth.getDate() + 1);
        }

        return days;
    }

    private getFullCalendarDays = (month: number, year: number) => {
        let days: Date[] = this.getDaysFromMonth(month, year);

        let counter = 0;
        //While the first day is not Sunday
        while(days[0].getDay() !== 0) {
            days.unshift(new Date(year, month, -1 * (counter)))
            counter++;
        }

        //While the last day is not a Saturday
        while(days[days.length - 1].getDay() !== 6) {
            days.push(new Date(days[days.length - 1].getFullYear(), days[days.length - 1].getMonth(), days[days.length - 1].getDate() + 1))
        }
        return days;
    }

    private localDateToDisplayString = (date: Date): string => {
        let day = date.getDate();
        let dayAsString: string = day.toString();
        return `${dayAsString}`
    }

}

export default HomePage;