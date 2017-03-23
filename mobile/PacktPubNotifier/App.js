import React from 'react';
import { AppState, StatusBar, Platform, AsyncStorage, StyleSheet, Image, View, Linking } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Firestack from 'react-native-firestack';
import FCM from 'react-native-fcm';
import { Spinner, Button, Icon, Text, Card, CardItem } from 'native-base';

const STORAGE_KEY = 'PACKT_PUB_NOTIFIER_STATE_KEY';
const TOPIC_NAME = 'receive_book_notification'

console.disableYellowBox = true;
const firestack = new Firestack();

export default class App extends React.Component {
  state = {
    books: [],
    currentBookIndex: 0,
    wantsToReceiveNotifications: false
  }

  async componentWillMount() {
    StatusBar.setBarStyle('light-content');
    AppState.addEventListener('change', this.handleStateChange);

    try {
      let savedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedState) {
        this.setState(JSON.parse(savedState), () => {
          this.fetchBooks();
        });
      } else {
        this.fetchBooks();
      }

    } catch (e) {
      this.fetchBooks();
    }

    firestack.analytics.logEventWithName("launch", {});
  }

  async componentDidUpdate() {
    let stateCopy = { ...this.state };
    delete stateCopy.currentBookIndex;
    AsyncStorage.mergeItem(STORAGE_KEY, JSON.stringify(stateCopy));
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleStateChange);
  }

  handleStateChange = (appState) => {
    if (appState === 'active') {
      this.fetchBooks();
      firestack.analytics.logEventWithName("reopen", {});
    }
  }

  async fetchBooks() {
    try {
      StatusBar.setNetworkActivityIndicatorVisible(true);
      let res = await fetch('https://iot-bootcamp-158521.appspot.com/api/books');
      let json = await res.json();
      let currentBookIndex = this.state.currentBookIndex;
      if (this.state.books.length !== json.books.length) {
        currentBookIndex = 0;
      }
      this.setState({ books: json.books, currentBookIndex });
    } finally {
      StatusBar.setNetworkActivityIndicatorVisible(false);
    }
  }

  renderEmptyBook() {
    return (
      <View style={styles.card}>
        <Animatable.View style={styles.emptyCardImg}
          animation="pulse" easing="ease-out" iterationCount="infinite">
          <Spinner primary />
        </Animatable.View>
        <Card style={{ marginTop: 20, flex: 0 }}>
          <CardItem cardBody style={styles.cardBody}>
            <Text style={styles.cardTitle}>
              Fetching book of the day...
            </Text>
            <View>
              <Spinner primary />
            </View>
          </CardItem>
        </Card>
      </View >
    );
  }

  openLink(link) {
    Linking.openURL(link);
  }

  renderBook(book, claim) {
    return (
      <View key={book.slug} style={styles.card}>
        <Animatable.Image source={{ uri: book.img }} style={styles.cardImg}
          animation="pulse" easing="ease-out" iterationCount="infinite" />
        <Card style={{ marginTop: 20, flex: 0 }} >
          <CardItem cardBody style={styles.cardBody}>
            <View>
              <Text style={styles.cardTitle}>
                {book.title || 'Sem titulo'}
              </Text>
              <Text style={styles.cardDate}>
                {new Date(book.date).toLocaleDateString()}
              </Text>
              <Text numberOfLines={4}
                style={styles.cardSubtitle}>
                {book.description || 'Sem descrição'}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <Button primary style={styles.claimButton} onPress={() => this.openLink(book.link)}>
                <Icon name="link" />
                <Text>See book</Text>
              </Button>
              {claim && <Button success style={styles.claimButton} onPress={() => this.openLink(book.claimLink)}>
                <Icon name="heart" active />
                <Text>Claim book</Text>
              </Button>}
            </View>

          </CardItem>
        </Card>
      </View >
    )
  }

  renderSubscribeButton() {
    let { wantsToReceiveNotifications } = this.state;
    const subscribe = async () => {
      if (!wantsToReceiveNotifications) {
        FCM.requestPermissions();
        FCM.subscribeToTopic(TOPIC_NAME);
        firestack.analytics.logEventWithName('subscribe', {});
      } else {
        FCM.unsubscribeFromTopic(TOPIC_NAME);
        firestack.analytics.logEventWithName('unsubscribe', {});
      }
      this.setState({ wantsToReceiveNotifications: !wantsToReceiveNotifications })
    };
    return (
      <Button danger={wantsToReceiveNotifications}
        success={!wantsToReceiveNotifications}
        style={styles.claimButton} onPress={subscribe}>
        <Icon name="notifications" active={wantsToReceiveNotifications} />
        <Text>{wantsToReceiveNotifications ? 'Stop' : 'Receive'} notifications</Text>
      </Button>
    );

  }

  renderNextButton() {
    const next = (state) => {
      firestack.analytics.logEventWithName("nextbook", {});
      return {
        currentBookIndex: state.currentBookIndex + 1
      };
    };
    return (
      <Button primary style={styles.claimButton} onPress={() => this.setState(next)} >
        <Icon name="arrow-forward" />
      </Button>
    );
  }

  renderPrevButton() {
    const prev = (state) => {
      firestack.analytics.logEventWithName("prevbook", {});
      return {
        currentBookIndex: state.currentBookIndex - 1
      };
    };
    return (
      <Button primary style={styles.claimButton} onPress={() => this.setState(prev)} >
        <Icon name="arrow-back" />
      </Button>
    );
  }

  renderButtons() {
    let { books, currentBookIndex } = this.state;
    let showLeft = currentBookIndex > 0;
    let showRight = currentBookIndex + 1 !== books.length;
    return (
      <View style={styles.buttonRow}>
        {showLeft && this.renderPrevButton()}
        {this.renderSubscribeButton()}
        {showRight && this.renderNextButton()}
      </View>
    )
  }

  renderContent() {
    let { currentBookIndex, books } = this.state;
    let currentBook = books[currentBookIndex];
    if (!!!currentBook) {
      return this.renderEmptyBook();
    }
    return this.renderBook(currentBook, currentBookIndex === 0);
  }

  renderBackground(img) {
    if (Platform.OS === 'ios') {
      return (
        <Image source={{ uri: img }}
          blurRadius={8}
          style={StyleSheet.absoluteFill} />
      )
    }
    let backgroundColor = 'rgba(0,0,0,0.4)';
    return (
      <View style={StyleSheet.absoluteFill}>
        <Image source={{ uri: img }}
          style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill,
        { backgroundColor }]} />
      </View>
    )

  }

  render() {
    let { books, currentBookIndex } = this.state;
    let currentBook = books[currentBookIndex];
    let loaded = !!currentBook;
    return (
      <View style={styles.container}>
        {loaded && this.renderBackground(currentBook.img)}

        <View style={{ flex: 1, padding: 8, paddingTop: 60, backgroundColor: 'transparent' }}>
          {this.renderContent()}
          {loaded && this.renderButtons()}
        </View>
      </View>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#cacaca',
  },
  card: {
    flex: 10,
    flexDirection: 'column',
    justifyContent: 'space-around',
    shadowColor: 'black',
    shadowOffset: {
      width: 5,
      height: 5
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 2
  },
  cardImg: {
    flex: 1,
    minHeight: 180,
    maxHeight: 280,
    resizeMode: 'contain'
  },
  emptyCardImg: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: 300,
    backgroundColor: 'white'
  },
  cardTitle: {
    flex: 0,
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardDate: {
    fontSize: 10,
    fontWeight: 'bold',
    margin: 0,
    marginBottom: 10
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 10
  },
  cardBody: {
    flex: 0,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 7
  },
  claimButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    padding: 11,
  },
  buttonRow: {
    marginVertical: 5,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-around'
  }
};
