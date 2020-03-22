import React from 'react';
import {StyleSheet} from "react-native";
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import {ApplicationProvider, IconRegistry, Icon, Layout, Text, Button} from '@ui-kitten/components';
import {mapping, light as lightTheme} from '@eva-design/eva';
import {theme} from './themes';

const NavIcon = (style) => (
  <Icon {...style} name='navigation'/>
);

const ServerIcon = (style) => (
  <Icon {...style} name='link'/>
);

export class HomeScreen extends React.Component {
  state = {
    server: 'ws://192.168.1.101:8088',
    speed: '32.4',
    cadence: '54.4',
    heartRate: '126',
  };

  render() {
    return (
      <Layout style={{flex: 1, paddingTop: '10%'}}>
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
              <Text category='h2' style={styles.dataText}>{this.state.heartRate}</Text>
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
          <Button style={styles.inputStyle} icon={ServerIcon} >
            SET SERVER
          </Button>
          <Button style={styles.inputStyle} icon={NavIcon} >
          SET CENTER
          </Button>
        </Layout>
      </Layout>
    );
  }
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputStyle: {height: 50, width: '50%', marginTop: 10, marginBottom: 10},
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 5,
  },
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
  },
  welcomeImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  categoryLabel: {
    marginHorizontal: 24,
    marginTop: 8,
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
});

const App = () => (
  <ApplicationProvider mapping={mapping} theme={theme}>
    <IconRegistry icons={EvaIconsPack}/>
    <HomeScreen/>
  </ApplicationProvider>
);

export default App;
