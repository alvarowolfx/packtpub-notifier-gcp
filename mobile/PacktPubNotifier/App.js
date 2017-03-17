import Expo, {
  Components
} from 'expo';
const { BlurView } = Components;
import React from 'react';
import { StyleSheet, Image, View, Linking } from 'react-native';
import * as Animatable from 'react-native-animatable';

import { Spinner, Button, Icon, Text, Card, CardItem } from 'native-base';

export default class App extends React.Component {
  state = {
    isReady: false,
    books: [],
    currentBookIndex: 0
  }

  async componentWillMount() {
    try {
      let res = await fetch('https://iot-bootcamp-158521.appspot.com/api/books');
      let json = await res.json();
      this.setState({ isReady: true, books: json.books, currentBookIndex: 0 });
    } catch (e) {
      this.setState({ isReady: true });
    }
  }

  renderEmptyBook() {
    return (
      <View style={styles.card}>
        <Animatable.View style={styles.emptyCardImg}
          animation="pulse" easing="ease-out" iterationCount="infinite">
          <Spinner />
        </Animatable.View>
        <Card style={{ marginTop: 20 }}>
          <CardItem cardBody style={styles.cardBody}>
            <Text style={styles.cardTitle}>
              Carregando livro do dia...
            </Text>
            <View>
              <Spinner />
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
        <Card style={{ marginTop: 20 }}>
          <CardItem cardBody style={styles.cardBody}>

            <View>
              <Text style={styles.cardTitle}>
                {book.title || 'Sem titulo'}
              </Text>
              <Text style={styles.cardSubtitle}>{book.description || 'Sem descrição'}</Text>
            </View>

            <View style={styles.buttonRow}>
              <Button primary style={styles.claimButton} onPress={() => this.openLink(book.link)}>
                <Icon name="link" />
                <Text>Ver livro</Text>
              </Button>
              {claim && <Button success style={styles.claimButton} onPress={() => this.openLink(book.claimLink)}>
                <Icon name="heart" active />
                <Text>Obter livro</Text>
              </Button>}
            </View>

          </CardItem>
        </Card>
      </View >
    )
  }

  renderSubscribeButton() {
    return (
      <Button success style={styles.claimButton} >
        <Icon name="notifications" />
        <Text>Quero receber notificações</Text>
      </Button>
    );
  }

  renderContent() {
    let { currentBookIndex, books, isReady } = this.state;
    if (!isReady) {
      return this.renderEmptyBook();
    }
    let currentBook = books[currentBookIndex];
    return this.renderBook(currentBook, currentBookIndex === 0);
  }

  renderNextButton() {
    const next = (state) => {
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

  render() {
    let { books, isReady, currentBookIndex } = this.state;
    let currentBook = books[currentBookIndex];
    return (
      <View style={styles.container}>
        {isReady && <Image source={{ uri: currentBook.img }} style={StyleSheet.absoluteFill} />}
        <BlurView tint="default" intensity={100} style={StyleSheet.absoluteFill} />

        <View style={{ flex: 1, padding: 8, paddingTop: 60, backgroundColor: 'transparent' }}>
          {this.renderContent()}
          {isReady && this.renderButtons()}
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
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
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
    minHeight: 250,
    maxHeight: 280,
    resizeMode: 'contain'
  },
  emptyCardImg: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 200,
    backgroundColor: 'white'
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10
  },
  cardSubtitle: {
    fontSize: 14
  },
  cardBody: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 7
  },
  claimButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonRow: {
    margin: 5,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-around'
  }
};
