import React from 'react';
import {StyleSheet, SafeAreaView} from "react-native";
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import {ApplicationProvider, IconRegistry, Icon, Layout, Text, Button, Modal, Input} from '@ui-kitten/components';
import {mapping} from '@eva-design/eva';
import {theme} from './themes';

const IconNav = (style) => (
  <Icon {...style} name='navigation'/>
);

const IconServer = (style) => (
  <Icon {...style} name='link'/>
);

const IconGo = (style) => (
  <Icon {...style} name='arrowhead-up'/>
);

const IconStop = (style) => (
  <Icon {...style} name='stop-circle'/>
);


export class HomeScreen extends React.Component {
  state = {
    server: 'ws://192.168.1.101:8088/',
    speed: 'n/a',
    cadence: 'n/a',
    heartrate: 'n/a',
    lastUpdate: {
      speed: new Date(),
      cadence: new Date(),
      heartrate: new Date(),
    },
    modalVisible: false,
    heading: 0,
    center: null,
    steering: 0,
    raw: 0,
  };

  ws = null;

  clearValue = (key) => {
    setTimeout(() => {
      if (new Date() - this.state.lastUpdate[key] >= 3000) {
        // If last update older than 3000 ms, set to n/a
        let update = {};
        update[key] = 'n/a';
        this.setState(update)
      }
    }, 3000)
  };

  connectToServer = () => {
    if (this.ws !== null) {
      // Disconnect from old server
      this.ws.close();
    }
    if (this.state.server === '') { // No server set
      return;
    }
    // Connect to Carbon Descent Server
    this.ws = new WebSocket(this.state.server);
    this.ws.onopen = () => {
      // connection opened
    };

    this.ws.onmessage = (e) => {
      // a message was received
      let message = JSON.parse(e.data);
      if (message.type === 'speed') {
        this.setState({speed: message.value.toFixed(1)});
        this.state.lastUpdate['speed'] = new Date();
        this.clearValue('speed');
      } else if (message.type === 'cadence') {
        this.setState({cadence: message.value.toFixed(1)});
        this.state.lastUpdate['cadence'] = new Date();
        this.clearValue('cadence');
      } else if (message.type === 'heartrate') {
        this.setState({heartrate: message.value.toFixed(0)});
        this.state.lastUpdate['heartrate'] = new Date();
        this.clearValue('heartrate');
      }
    };

    this.ws.onerror = (e) => {
      // an error occurred
      console.log(e.message);
    };

    this.ws.onclose = (e) => {
      // connection closed
      console.log(e.code, e.reason);
    };
  };

  setModalVisible = () => {
    const modalVisible = !this.state.modalVisible;
    this.setState({modalVisible});
    this.connectToServer();
  };

  onChangeServer = (server) => {
    this.state.server = server;
    this.setState({server});
  };

  renderUpdateServerModalElement = () => {
    return (
      <Layout
        level='3'
        style={styles.modalContainer}>
        <Text style={[{marginTop: 30}]} category='p1'>SERVER URL:</Text>
        <Input
          style={[styles.inputStyle]}
          value={this.state.server}
          placeholder='ws://...'
          onChangeText={this.onChangeServer}
          icon={IconServer}
        />
        <Button style={[styles.inputStyle]} status='primary' appearance='ghost'
                onPress={this.setModalVisible}>OK</Button>
      </Layout>
    );
  };

  onEditServerPress = () => {
    this.setState({modalVisible: true});
  };

  onMovePress = () => {
    if (this.ws !== null && this.ws.readyState === 1) {
      let moveMsg = {
        type: 'move',
        value: 30,
      };
      this.ws.send(JSON.stringify(moveMsg));
    }
  };

  onStopPress = () => {
    if (this.ws !== null && this.ws.readyState === 1) {
      let breakMsg = {
        type: 'break',
        value: 0,
      };
      this.ws.send(JSON.stringify(breakMsg));
    }
  };

  calcSteering = () => {
    let steer_dead_zone = 0.22;
    let change = (this.state.heading - this.state.center + 540) % 360 - 180;
    let steer = change / 90;
    // Add dead zones
    if (steer > 0) {
      steer += steer_dead_zone;
    } else if (steer < 0) {
      steer -= steer_dead_zone;
    }
    this.setState({steering: steer});
  };

  sendSteering = () => {
    if (this.ws !== null && this.ws.readyState === 1) {
      // Find steering
      let steeringMessage = {
        type: 'steering',
        value: this.state.steering,
      };
      this.ws.send(JSON.stringify(steeringMessage));
    }
  };

  subscribeHeading = async () => {
    await Location.watchHeadingAsync((data) => {
      if (this.state.center === null) {
        this.setState({center: data.trueHeading});
      }
      this.setState({heading: data.trueHeading});
      this.calcSteering();
      this.sendSteering();
    });
  };

  _getLocationAsync = async () => {
    let {status} = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
  };

  async componentDidMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      this._getLocationAsync();
    }
    await this.subscribeHeading();
  }

  setCenter = () => {
    this.setState({center: this.state.heading});
    this.calcSteering();
    this.sendSteering();
  };

  render() {
    return (
      <SafeAreaView style={{flex: 1, paddingTop: '30%'}}>
        <Layout style={{alignItems: 'center'}}>
          <Layout style={styles.rowContainer}>
            <Text>KPH</Text>
          </Layout>
          <Layout style={styles.rowContainer}>
            <Text category='h1' style={styles.dataText}>{this.state.speed}</Text>
          </Layout>
        </Layout>
        <Layout style={[styles.centerItem]}>
          <Layout style={styles.rowContainer2}>
            <Layout style={{alignItems: 'center'}}>
              <Text>BPM</Text>
              <Text category='h2' style={styles.dataText}>{this.state.heartrate}</Text>
            </Layout>
            <Layout style={{alignItems: 'center'}}>
              <Text>RPM</Text>
              <Layout style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text category='h2' style={styles.dataText}>{this.state.cadence}</Text>
              </Layout>
            </Layout>
          </Layout>
        </Layout>
        <Layout style={{alignItems: 'center', marginTop: 20}}>
          <Text style={styles.text}>
            Heading: {this.state.heading.toFixed(1)}
          </Text>
          <Text style={styles.text}>
            Steering: {this.state.steering.toFixed(2)}
          </Text>
          <Button style={styles.buttonStyle} icon={IconNav} onPress={this.setCenter}>
            SET CENTER
          </Button>
          <Button style={styles.buttonStyle} icon={IconGo} onPress={this.onMovePress}>
            MOVE
          </Button>
          <Button style={styles.buttonStyle} icon={IconStop} onPress={this.onStopPress}>
            STOP
          </Button>
          <Layout style={{marginTop: 40}}/>
          <Button style={styles.buttonStyle} icon={IconServer} onPress={this.onEditServerPress}>
            CONNECT SERVER
          </Button>
        </Layout>
        <Modal
          allowBackdrop={true}
          backdropStyle={{backgroundColor: 'black', opacity: 0.5}}
          onBackdropPress={this.setModalVisible}
          visible={this.state.modalVisible}>
          {this.renderUpdateServerModalElement()}
        </Modal>
      </SafeAreaView>
    );
  }
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonStyle: {height: 50, width: '60%', marginTop: 10, marginBottom: 10},
  inputStyle: {height: 50, width: '90%', marginTop: 5, marginBottom: 5},
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
  },
  dataText: {
    color: '#2a2626',
  },
  centerItem: {
    marginTop: 20,
    marginBottom: 20,
  },
  rowContainer2: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
  },
  modalContainer: {
    width: 300,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const App = () => (
  <ApplicationProvider mapping={mapping} theme={theme}>
    <IconRegistry icons={EvaIconsPack}/>
    <HomeScreen/>
  </ApplicationProvider>
);

export default App;
