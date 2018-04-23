import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import RekognizeForm from '../../components/RekognizeRegistry/RekognizeRegistry';
import SwitchComponent from '../../components/UI/Switch/SwitchComponent';
import './Settings.css';
import { insertPhotoToGallery, clearGallery } from '../../store/actions/rekognize';
import refreshBg from '../../images/refresh.png';
import Device from '../../device';
import * as config from '../../config';

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showRekognizeForm: false,
      isSaveModeEnable: JSON.parse(localStorage.getItem('saveModeON')),
    };
  }
  onRefreshBtnClickHandler = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('events');
    localStorage.removeItem('calendarId');
    window.plugins.googleplus.logout();
    window.location.reload();
  }

  onBtnAddUserClickHandler = () => {
    this.setState(prevState => ({
      showRekognizeForm: !prevState.showRekognizeForm,
    }));
  }

  onRekognizeSubmit = () => {
    const eventSubmit = window.event;
    Device.createPhoto().then((img) => {
      if (eventSubmit.target.rekognizeEmail.value) {
        this.props.insertPhotoToGallery(img, `${eventSubmit.target.rekognizeName.value}%%${eventSubmit.target.rekognizeEmail.value}`);
        this.setState({ showRekognizeForm: false });
      } else {
        navigator.notification.alert('Error!\nemail are required', null, 'Room Manager', 'OK');
      }
    });
    eventSubmit.preventDefault();
    eventSubmit.stopPropagation();
  }

  updateCheck() {
    this.setState((oldState) => {
      Device.isSaveModeEnable = !oldState.isSaveModeEnable;
      localStorage.setItem('saveModeON', !oldState.isSaveModeEnable);
      return {
        isSaveModeEnable: !oldState.isSaveModeEnable,
      };
    });
  }

  render() {
    if (!this.props.show) return null;
    return (
      <div className="Settings">
        <h3>Settings</h3>
        <div className="Settings-content">
          <h2>{config.PROGRAM_NAME}</h2>
          <div className="version">{`version: ${config.VERSION}`}</div>
          <hr />
          <SwitchComponent
            active={this.state.isSaveModeEnable}
            message="Save mode"
            updateCheck={() => this.updateCheck()}
            id="1"
          />
          <button onClick={() => window.KioskPlugin.exitKiosk()} className="btn-rekognize">Exit</button>
          <p>Erase all data && Refresh</p>
          <button className="btn-refresh" style={{ backgroundImage: `url(${refreshBg})` }} onClick={this.onRefreshBtnClickHandler}>Reset</button>
          <div className="rekognize-section">
            <label className="Settings-title">Rekognize:</label>
            <button className="btn-rekognize" onClick={this.onBtnAddUserClickHandler}>Add User</button>
            <button className="btn-rekognize" onClick={this.props.clearGallery}>Reset users</button>
          </div>
          <RekognizeForm
            show={this.state.showRekognizeForm}
            onAdd={this.onRekognizeSubmit}
          />
        </div>
        <button className="btn-close" onClick={() => this.props.hideWindow()}>Close</button>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => bindActionCreators({
  insertPhotoToGallery,
  clearGallery,
}, dispatch);
export default connect(null, mapDispatchToProps)(Settings);
