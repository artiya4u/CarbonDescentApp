import React from 'react';
import {StyleSheet, SafeAreaView} from "react-native";
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import {Magnetometer} from 'expo-sensors';
import {ApplicationProvider, IconRegistry, Icon, Layout, Text, Button, Modal, Input} from '@ui-kitten/components';
import {mapping} from '@eva-design/eva';
import {theme} from './themes';

const NavIcon = (style) => (
  <Icon {...style} name='navigation'/>
);

const ServerIcon = (style) => (
  <Icon {...style} name='link'/>
);

function round(n) {
  if (!n) {
    return 0;
  }

  return Math.floor(n * 100) / 100;
}

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
    magnetometer: 0,
    setDirection: null,
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
          icon={ServerIcon}
        />
        <Button style={[styles.inputStyle]} status='primary' appearance='ghost'
                onPress={this.setModalVisible}>OK</Button>
      </Layout>
    );
  };

  onEditServerPress = () => {
    this.setState({modalVisible: true});
  };

  subscribeMagnetometer = () => {
    Magnetometer.addListener(data => {
      this.setState({magnetometer: this._angle(data)});
      if (this.ws !== null) {
        let steeringMessage = {
          type: 'steering',
          value: 0,
        };
        this.ws.send(JSON.stringify(steeringMessage));
      }
    });
    Magnetometer.setUpdateInterval(50);
  };

  componentDidMount() {
    this.subscribeMagnetometer();
  }

  _angle = (magnetometer) => {
    let angle = 0;
    if (magnetometer) {
      let {x, y, z} = magnetometer;

      if (Math.atan2(y, x) >= 0) {
        angle = Math.atan2(y, x) * (180 / Math.PI);
      } else {
        angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
      }
    }

    return Math.round(angle);
  };

  _degree = (magnetometer) => {
    return magnetometer - 90 >= 0 ? magnetometer - 90 : magnetometer + 271;
  };

  setCenter = () => {
    this.setState({setDirection: this._degree(this.state.magnetometer)});
  };

  render() {
    return (
      <SafeAreaView style={{flex: 1, paddingTop: '10%'}}>
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
        <Layout style={{alignItems: 'center', marginTop: 50}}>
          <Button style={styles.buttonStyle} icon={ServerIcon} onPress={this.onEditServerPress}>
            CONNECT SERVER
          </Button>
          <Button style={styles.buttonStyle} icon={NavIcon} onPress={this.setCenter}>
            SET CENTER
          </Button>
          <Text style={styles.text}>
            Angle: {this._degree(this.state.magnetometer)}
          </Text>
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
