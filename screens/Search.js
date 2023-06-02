import React, {useEffect, useState} from 'react';
import { StatusBar } from "expo-status-bar";
import { View, Button, Text, Dimensions, StyleSheet, ScrollView, } from 'react-native';
import extractUltraSrtWeather from './Main';
import {extractVilageWeather} from './Main';
import {commentWeather} from './Main';
import {sensoryTemp} from './Main'
import {makeSensoryData} from './Main'
import { makeData } from './Main';
import {
    LineChart,
  } from "react-native-chart-kit";


const {width:screenWidth} = Dimensions.get("window");

const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false // optional
  };

const Search = ({ navigation, route }) => {
    const [TEMP, setTemp]=useState();
    const [SKY, setSky]=useState();
    const [wind, setWind]=useState();
    const [rainfall, setRainfall]=useState();
    const [sensoryTEMP, setSensoryTemp]=useState();

    const [lowerTEMP, setLowerTemp]=useState();
    const [upperTEMP, setUpperTemp]=useState();

    const [tempData, setTempData]=useState(null);
    const [windData, setWindData]=useState(null);
    const [rainData, setRainData]=useState(null);
    const [sensoryData, setSensoryData]=useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getSearchWeather = async () => {

        const { srcUltraSrtInfo, srcVilageInfo, searchTmpForTime, searchWindForTime, searchRainForTime, searchHumidityForTime } = route.params;
        console.log("tqtqtq", srcUltraSrtInfo);
        //console.log("ㅈㅂ", extractUltraSrtWeather(searchUrl));
        //const ultraSrtWeatherInfo = extractUltraSrtWeather(searchUrl);
        console.log("온도도돋",srcUltraSrtInfo)

        setSensoryTemp(sensoryTemp(parseFloat(ultraSrtWeatherInfo.temperature),parseFloat(ultraSrtWeatherInfo.humidity)));
        setRainfall(srcUltraSrtInfo.rainfall);
        setTemp(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").temperature).replace(/\"/gi, "")); // 기온
        setSky(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").sky).replace(/\"/gi, "")); // 하늘 상태
        setWind(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").wind).replace(/\"/gi, "")); // 풍속

        setLowerTemp(JSON.stringify(srcVilageInfo.lowerTmp).replace(/\"/gi, ""));
        setUpperTemp(JSON.stringify(srcVilageInfo.upperTmp).replace(/\"/gi, ""));

    }

    const compareWeather = async () => {
        
        const { srcUltraSrtInfo, srcVilageInfo, searchTmpForTime, searchWindForTime, searchRainForTime, searchHumidityForTime, vilageJson } = route.params;

        // const testUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D&numOfRows=60&pageNo=1&base_date=20230601&base_time=1400&nx=60&ny=127&dataType=json`;
        // const testUrl2 = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=DHAcdCIG92vecEcQDukq%2B%2Fn8eWJtPZ9jKZ3isc%2FWrsnaFK1ZMGLQraTGzmMhDIQLj%2FZCUSkvmj1BgKChWFkbjw%3D%3D&numOfRows=290&pageNo=1&base_date=20230601&base_time=2300&nx=60&ny=127&dataType=json`;
        // const compareResponse = await fetch(testUrl);
        // const compareJson = await compareResponse.json();
        // const searchResponse = await fetch(testUrl2);
        // const searchJson = await searchResponse.json();
    
        

        // 검색 지역 초단기예보
        // compareInfo=extractUltraSrtWeather(compareJson); 
        console.log("검색 지역!! : ", commentWeather(srcUltraSrtInfo,"ultraSrt"));
    
        // getWeather에서 생성한 vilageJson 사용
        // 6,9,12,15,18,21시 기온
        currentTmpForTime=extractVilageWeather(vilageJson)[1]; 
        //searchTmpForTime=extractVilageWeather(searchJson)[1];
        const currentTmpList=makeData(currentTmpForTime);
        const searchTmpList=makeData(searchTmpForTime);
        //console.log("검색 지역 기온 : ", searchTmpForTime);
    
        // 6,9,12,15,18,21시 풍속
        currentWindForTime=extractVilageWeather(vilageJson)[2]; 
        //searchWindForTime=extractVilageWeather(searchJson)[2];
    
        // 6,9,12,15,18,21시 강수량
        currentRainForTime=extractVilageWeather(vilageJson)[3];
        //searchRainForTime=extractVilageWeather(searchJson)[3];
    
        // 6,9,12,15,18,21시 습도
        currentHumidityForTime=extractVilageWeather(vilageJson)[4];
        //searchHumidityForTime=extractVilageWeather(searchJson)[4];
        const currentHumidityList=makeData(currentHumidityForTime);
        const searchHumidityList=makeData(searchHumidityForTime);
    
        const currentSensoryData = makeSensoryData(currentTmpList,currentHumidityList);
        const searchSensoryData = makeSensoryData(searchTmpList,searchHumidityList);
    
        const dataForTmp = {
          labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
          datasets : [
            {
              data: makeData(currentTmpForTime),
              color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
              strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
            },
            {
              data: makeData(searchTmpForTime),
              color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
              strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
            }
          ],
          legend: ["시간대별 기온 비교"] // optional
        };
    
        const dataForWind = {
          labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
          datasets : [
            {
              data: makeData(currentWindForTime),
              color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
              strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
            },
            {
              data: makeData(searchWindForTime),
              color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
              strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
            }
          ],
          legend: ["시간대별 풍속 비교"] // optional
        };
    
        const dataForRain = {
          labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
          datasets : [
            {
              data: makeData(currentRainForTime),
              color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
              strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
            },
            {
              data: makeData(searchRainForTime),
              color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
              strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
            }
          ],
          legend: ["시간대별 강수량 비교"] // optional
        };
    
        const dataForSensory = {
          labels: ["6시", "9시", "12시", "15시", "18시", "21시"],
          datasets : [
            {
              data: currentSensoryData,
              color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 첫 번째 데이터 세트의 색상
              strokeWidth: 2 // 첫 번째 데이터 세트의 선 두께
            },
            {
              data: searchSensoryData,
              color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 두 번째 데이터 세트의 색상
              strokeWidth: 2 // 두 번째 데이터 세트의 선 두께
            }
          ],
          legend: ["시간대별 체감온도 비교"] // optional
        };
    
        // console.log("data 확인",data.datasets[0].data);
        setTempData(dataForTmp);
        setWindData(dataForWind);
        setRainData(dataForRain);
        setSensoryData(dataForSensory);
        setIsLoading(false); // 데이터 로딩 완료 상태 설정
    
      
      };

    useEffect(() => {
        getSearchWeather();
        compareWeather();
      }, []);

    return (
    <View style={styles.container}>
        <StatusBar style="light"></StatusBar>

        <ScrollView
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        horizontal 
        contentContainerStyle={styles.weather}
        >
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
            <>{tempData && (
            <LineChart
                data={tempData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
            />)} 
            </>
        )}
            <Text style={styles.temp}>{TEMP}</Text>
            <Text style={styles.description}>{SKY}</Text>
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
        <>
            {windData && (
            <LineChart
            data={windData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            />
            )}  
        </>
        )}
            <Text style={styles.temp}>{lowerTEMP}</Text>
            <Text style={styles.description}>{upperTEMP}</Text>
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
        <>
            {rainData && (
            <LineChart
            data={rainData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            />
            )}  
        </>
        )}
            {/* <Text style={styles.temp}>미세먼지 등급 </Text>
            <Text style={styles.description}>{pmGrade10}</Text> */}
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
            <>{sensoryData && (
            <LineChart
                data={sensoryData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
            />)} 
            </>
        )}
            {/* <Text style={styles.temp}>초미세먼지 등급</Text>
            <Text style={styles.description}>{pmGrade25}</Text> */}
        </View>
        <View style={styles.day}>
            {/* <Text style={styles.temp}>미세먼지 농도</Text>
            <Text style={styles.description}>{pmValue10}</Text> */}
        </View>
        <View style={styles.day}>
            {/* <Text style={styles.temp}>초미세먼지 농도</Text>
            <Text style={styles.description}>{pmValue25}</Text> */}
        </View>
        <View style={styles.day}>
            <Text style={styles.temp}>체감온도</Text>
            <Text style={styles.description}>{sensoryTEMP}</Text>
        </View>
        <View style={styles.day}>
            <Text style={styles.temp}>풍속</Text>
            <Text style={styles.description}>{wind}</Text>
        </View>
        <View style={styles.day}>
            <Text style={styles.temp}>강수량</Text>
            <Text style={styles.description}>{rainfall}</Text>
        </View>
        
        </ScrollView>
    </View>
    );
    
}

const styles = StyleSheet.create({
    container:{
        flex:1, 
        backgroundColor:"green"
    },
    city:{
        flex:1,
        //backgroundColor:"blue",
        justifyContent:"center",
        alignItems:"center"
    },
    cityName:{
        fontSize:60,
        fontWeight:"500"
    },
    weather:{
        //flex:3,
        //backgroundColor:"blue"
    },
    day:{
        width:screenWidth,
        //flex:1,
        //backgroundColor:"teal",
        alignItems:"center"
    },
    temp:{
        marginTop:30,
        fontSize:100,
    },
    description:{
        fontSize:70,
    }
    })

  


export default Search;

// return (
//     <View>
//       <Button
//         title="Test 열기"
//         onPress={() => navigation.navigate('Test')}
//       />
//     </View>
//   );