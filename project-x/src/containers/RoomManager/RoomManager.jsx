/* global alert */
import React, { Component } from 'react';
import RoomStatus from '../../components/RoomStatusWidget/RoomStatus';
import EventBuilder from '../EventBuilder/EventBuilder';
import { connect } from 'react-redux';
import { loadEvents, loadCurrentEvent, refreshToken } from '../../store/actions/calendar';
import { getClock, getTimeString } from '../../service/util';
import Device from '../../device';
import * as config from '../../config';

class RoomManager extends Component {
  constructor( props ) {
    super( props );
    this.state = {
      currentTime: new Date(),
      isEventBuilderShow: false
    };
    this.timer = null;
    this.clock = null;
  }
  
  onRoomStatusBtnClickHandler = () => {
    this.setEventBuilderVisibility( true );
  }
  setEventBuilderVisibility = show => {
    this.setState( { isEventBuilderShow: show } );
  }

  render() {
    return (
      <div >
        <RoomStatus 
          status = { this.props.room.status } 
          eventName = { this.props.room.eventName } 
          timeEventBegin = { getClock( this.props.room.timeStart ) } 
          timeEventFinish = { getClock( this.props.room.timeEnd ) }
          timeToNextEvent = { getTimeString( this.props.room.timeToNextEvent ) } 
          description = { this.props.room.description }
          currentTime = { getClock( this.state.currentTime ) }
          BtnName = { this.props.room.BtnName }
          clicked = { () => this.onRoomStatusBtnClickHandler() }
        />
        <EventBuilder 
          show = { this.state.isEventBuilderShow }
          hideEventBuilder = { () => this.setEventBuilderVisibility( false ) }
        />

      </div>
    );
  }

  componentDidMount() {
    const that = this;
    const syncStep = 60;
    let deviceMode = '';
    this.timer = setInterval( () => {
      if ( !window.cordova.plugins.backgroundMode.isEnabled()){
        window.cordova.plugins.backgroundMode.enable();
      }

      let tokenExpires = localStorage.getItem( 'expires_in' );
      if ( that.props.currentCalendar && navigator.connection.type !== window.Connection.NONE ) {
        that.props.loadCalenadarEvents( that.props.currentCalendar, that.props.token );
      }
      if ( tokenExpires ) {
        tokenExpires -= syncStep;
        if ( tokenExpires <= 0 && navigator.connection.type !== window.Connection.NONE ) { // refresh token
          that.props.updateToken();
        }
        localStorage.setItem('expires_in', tokenExpires);
      }
    }, syncStep * 1000 );

    this.clock = setInterval( () => { //every seconds
      const time = new Date();
      if ( that.state.currentTime.getMinutes() !== time.getMinutes() ) {
        that.setState( { currentTime: time } );
      }

      const timeToEvent = (Date.parse(that.props.events[0].start)||Infinity)-time;
      if(time.getHours() < config.SLEEP_MODE.end || time.getHours() >= config.SLEEP_MODE.start ){
        if(deviceMode !== 'SLEEP_MODE'){
          Device.setMode('SLEEP_MODE');
          deviceMode = 'SLEEP_MODE'
        }
      } else if(that.props.events.length === 0) {
        if(deviceMode !== 'IDLE_MODE'){
          Device.setMode('IDLE_MODE');
          deviceMode = 'IDLE_MODE'
        }
      } else if ( that.props.room.status === 'Busy' ){
        if(deviceMode !== 'ACTIVE_MODE'){
          Device.setMode('ACTIVE_MODE');
          deviceMode = 'ACTIVE_MODE'
        }
      } else if ( timeToEvent < config.MIDDLE_MODE.timeToStart * 60 * 1000 && timeToEvent > 0 ) {
        if(deviceMode !== 'MIDDLE_MODE'){
          Device.setMode('MIDDLE_MODE');
          deviceMode = 'MIDDLE_MODE'
        }
      } else {
        if(deviceMode !== 'IDLE_MODE'){
          Device.setMode('IDLE_MODE');
          deviceMode = 'IDLE_MODE'
        }
      }

      that.props.loadCurrentState( that.props.events[0] );
    }, 1000 );
  }
  componentWillUnmount() {
    clearInterval( this.timer );
    clearInterval( this.clock );
  }
}


const mapStateToProps = state => {
  return {
    events: state.calendar.currentCalendarEvents,
    token: state.calendar.access_token,
    currentCalendar: state.calendar.currentCalendar,
    room: state.calendar.room
  };
};
const mapDispatchToProps = dispatch => {
  return {
    loadCalenadarEvents: ( calendarId, token ) => dispatch( loadEvents( calendarId, token ) ),
    loadCurrentState: event => dispatch( loadCurrentEvent( event ) ),
    updateToken: () => dispatch( refreshToken() )
  };
};

export default connect( mapStateToProps, mapDispatchToProps )( RoomManager );
