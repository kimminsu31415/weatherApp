import { 
    FlatList, 
    SafeAreaView, 
    StyleSheet, 
    Text, 
    TextInput, 
    View,
    Alert, 
    Button,
    TouchableHighlight,
    TouchableOpacity,
 } from "react-native";
import React, { useState, Component } from "react";


const FilterProducts = () => {
    const [UserInput, setUserInput] = useState("");
    // 지역
    const products = [
        {
            id: 1,
            name: "한림읍",
            latitude: 126.26908611111111,
            longitude: 33.40714444444444,

        },
        {
            id: 2,
            name: "애월읍",
            latitude: 126.33146666666666,
            longitude: 33.458738888888895,
        },
        {
            id: 3,
            name: "구좌읍",
            latitude: 126.854075,
            longitude: 0.559737,
        },
        {
            id: 4,
            name: "조천읍",
            latitude: 1.14931,
            longitude: 33.51933611111111,
        },
        {
            id: 5,
            name: "한경면",
            latitude: 126.63623333333334,
            longitude: 33.53117777777778,
        },
        {
            id: 6,
            name: "추자면",
            latitude: 1.545367,
            longitude: 0.453597,
        },
        {
            id: 7,
            name: "우도면",
            latitude: 1.545667,
            longitude: 0.512397,
        },
        {
            id: 8,
            name: "일도2동",
            latitude: 126.29614166666667,
            longitude: 33.959472222222225,
        },
        {
            id: 9,
            name: "이도1동",
            latitude: 1.789567,
            longitude: 0.123597,
        },
        {
            id: 10,
            name: "이도2동",
            latitude: 1.545667,
            longitude: 0.597897,
        },
        {
            id: 11,
            name: "삼도1동",
            latitude: 33.500425,
            longitude: 126.5203,
        },
        {
            id: 12,
            name: "삼도동",
            latitude: 1.561237,
            longitude: 0.456597,
        },
        {
            id: 13,
            name: "용담1동",
            latitude: 1.561237,
            longitude: 0.456597,
        },
        {
            id: 14,
            name: "용담2동",
            latitude: 1.561237,
            longitude: 0.456597,
        },
        {
            id: 15,
            name: "장유1동",
            latitude: 1.561237,
            longitude: 0.456597,
        },
        {
            id: 16,
            name: "장유2동",
            latitude: 1.561237,
            longitude: 0.456597,
        },
        {
            id: 17,
            name: "장유3동",
            latitude: 1.561237,
            longitude: 0.456597,
        },
    ];

    const filterData = (item) => {
        //if the input is empty
        if(UserInput === ""){
            return(
                    <View style={styles.itemContainer}>
                        <Button style={styles.buttonplz}
                        title={item.name}
                        onPress={ () => {console.log(item.name, item.latitude, item.longitude)} }
                    />
                    </View>
            );
        }
        //if user has started searching
        if(item.name.toLowerCase().includes(UserInput.toLowerCase())){
            return(
                <View style={styles.itemContainer}>
                    <Button 
                        title={item.name}
                        onPress={ () => {console.log(item.name, item.latitude, item.longitude)} }
                    />
                </View>
            );
        }
    };

    return (
        <View>
            <SafeAreaView />
            <Text> </Text>
            <Text> </Text>
            <Text> </Text>
            <View style={styles.textInputContainer}>
                <TextInput 
                    placeholder="지역을 검색하세요"
                    onChangeText={(text)=> setUserInput(text)} 
                />
            </View>

            <FlatList 
                data={products} 
                renderItem={({item, index}) => filterData(item)}
            />
        </View>
    );
};

export default FilterProducts;

const styles = StyleSheet.create({
    textInputContainer: {
        borderColor: "black",
        borderWidth: 2,
        paddingHorizontal: 36,
        paddingVertical: 8,
        borderRadius: 6,
        marginHorizontal: 16,
    },

    itemContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        margin: 10,
        marginHorizontal: 16,
        backgroundColor: "#ebf5fb",
        paddingHorizontal: 36,
        paddingVertical: 16,
        borderRadius: 6,
    },
    buttonplz: {
        
    }
});