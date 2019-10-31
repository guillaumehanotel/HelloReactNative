import React, {Component} from 'react';
import {StyleSheet, View, Text, Button, ActivityIndicator, SafeAreaView, TextInput, ScrollView, Picker, PermissionsAndroid} from 'react-native';
import {connect} from 'react-redux';
import {postAd, fetchAllCategories} from '../utils/requests';
import MultiSelect from 'react-native-multiple-select';
import Geolocation from 'react-native-geolocation-service';

const APIKEY = "AIzaSyB4ZD3zbfTEfF7qMZ1mSfA8Dz67VuZZ5aU";

class CreateAd extends Component {

  constructor(props) {
    super(props);
    this.state = {
      user: this.props.user,
      categories: [],
      formAd: {
        title: null,
        description: null,
        type: 'Don',
        condition: null,
        localisation: null,
        user_id: this.props.user.id,
        category_id: null,
        latitude: null,
        longitude: null
      },
    };
    this.getAddress = this.getAddress.bind(this)
  }

  async componentDidMount() {
    const categories = await fetchAllCategories();
    this.setState({
      categories: categories.map((category) => {
        return {
          id: category.id,
          name: category.label,
        };
      }),
    });
    this.getCoordsPosition()
  }

  async getCoordsPosition() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          'title': 'ReactNativeCode Location Permission',
          'message': 'GiveYourThings App needs access to your location '
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
   
        console.log("Location Permission Granted.");
        Geolocation.getCurrentPosition(
          (position) => {
              console.log(position);
              this.setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              })
              console.log(this.state.latitude)
          },
          (error) => {
              // See error code charts below.
              console.log(error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
      else {
   
        console.log("Location Permission Not Granted");
   
      }
    } catch (err) {
      console.warn(err)
    }
    Geolocation.clearWatch(this.watchID);
    this.watchID = Geolocation.watchPosition(
      position => {
        console.log("New position!");
      },
      error => console.log(error),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        distanceFilter: 0
      }
    );

  }

  async getAddress () {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.state.latitude},${this.state.longitude}&key=${APIKEY}`;
    try {
      let response = await fetch(url);
      let responseJson = await response.json();
      console.log(responseJson)
      this.setState({
        localisation: response.data.formatted_address
      })
      // do what you want with the responseJson here.
      return responseJson
    } catch (error) {
      console.warn(error); 
      // make sure you handle error and return something if an error occurs
    }
  }
  
  createAd = async () => {
    const response = await postAd(this.state.user.id, this.state.formAd);
    if (response.status === 201) {
      console.log('ad created');
    } else {
      if (response.status === 400) {
        const error = await response.json();
        console.log(error)
      } else {
        console.log('fail to create ad');
      }
    }
    // TODO popup
    this.props.navigation.navigate('AdsList')
  };

  onSelectedItemChange = category_id => {
    this.setState({
      formAd: {...this.state.formAd, category_id: category_id[0]},
    });
  };

  render() {
    const categories = this.state.categories;
    if (categories.length === 0) {
      return (
        <View style={{flex: 1, paddingTop: 20}}>
          <ActivityIndicator/>
        </View>
      );
    }

    return (
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <TextInput
            value={this.state.formAd.title}
            onChangeText={value => this.setState({formAd: {...this.state.formAd, title: value}})}
            placeholder="Nom du produit"
          />
          <TextInput
            editable
            maxLength={40}
            value={this.state.formAd.description}
            multiline
            numberOfLines={4}
            onChangeText={value => this.setState({formAd: {...this.state.formAd, description: value}})}
            placeholder="Description"
          />
          <TextInput
            value={this.state.formAd.condition}
            onChangeText={value => this.setState({formAd: {...this.state.formAd, condition: value}})}
            placeholder="Êtat"
          />
          <TextInput
            value={this.state.formAd.localisation}
            onChangeText={value => this.setState({formAd: {...this.state.formAd, localisation: value}})}
            onChange={this.getAddress}
            placeholder="Localisation géographique"
          />
        </ScrollView>
        <MultiSelect
          hideTags
          selectText={"Catégorie"}
          items={categories}
          uniqueKey="id"
          ref={(component) => {
            this.multiSelect = component
          }}
          onSelectedItemsChange={this.onSelectedItemChange}
          //selectedItems={this.state.formAd.category_id}
          searchInputPlaceholderText="Choisissez une catégorie"
          displayKey="name"
          submitButtonText="Valider"
          single={true}
        />
        <Text>Catégorie choisie : {this.state.formAd.category_id}</Text>
        <Button title={'Déposer l\'annonce'} onPress={this.createAd}/>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: 'white',
  },
  info_button: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 40,
  },
  blank: {
    flex: 1,
  },
  informations: {
    flex: 1,
    marginTop: 30,
    marginLeft: 20,
    color: 'blue',
  },
});


const mapStateToProps = state => {
  return {
    user: state.auth.user,
  };
};

export default connect(mapStateToProps, null)(CreateAd);

