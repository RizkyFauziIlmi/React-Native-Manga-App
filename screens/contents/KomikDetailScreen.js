import { Badge, Heading, HStack, Image, ScrollView, Text, useColorMode, VStack, IconButton, Button, Icon } from 'native-base'
import React, { useEffect, useState } from 'react'
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons'
import Loading from '../../components/Loading'
import TopBar from '../../components/TopBar'
import { auth, db } from '../../firebase/firebaseConfig'
import { updateDoc, doc, arrayUnion, serverTimestamp, Timestamp, addDoc, arrayRemove } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { getSinopsis } from '../../utils/stringModify'

const KomikDetailScreen = ({ route, navigation }) => {
  const { endpoint, title } = route.params
  const [komikDetail, setKomikDetail] = useState(null)
  const [read, setRead] = useState(0)
  const [loadingFavorite, setLoadingFavorite] = useState(false)
  const { colorMode } = useColorMode()
  const [value, loading, error] = useDocument(
    doc(db, 'users', auth.currentUser ? auth.currentUser.email : 'user@example.com'),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  )

  let timestamp = new Timestamp.now()
  const data = value?.data()
  const chapter = data?.finishedChapter.map((item) => item.chapterEndpoint)
  const favorite = data?.favoriteManga.filter((item) => item.endpoint === endpoint)[0]
  const isFavorite = favorite?.endpoint

  useEffect(() => {
    const getKomikDetail = async () => {
      const response = await fetch(`https://komikindo-api.vercel.app/komik-detail/${endpoint}`)
      const data = await response.json()

      setKomikDetail(data[0])
    }

    getKomikDetail()
  }, [])

  if (komikDetail && !loading && value) {
    const pengarang = komikDetail.info.filter(item => {
      return item.hasOwnProperty('Pengarang');
    })

    return (
      <>
        <TopBar headingTitle={title} />
        <ScrollView>
          <VStack justifyContent={'center'} safeArea>
            {!chapter ? <Text color={'red.500'}>⚠️ Your Accout do Not Have a Database, Please contact developer at Help & Support Section</Text> : ""}
            <HStack width={'100%'} pl={4}>
              <Image shadow={100} source={{
                uri: komikDetail.thumb
              }} alt={komikDetail.title} resizeMode={'contain'} style={{ width: '30%' }} size={150} rounded="md" />
              <VStack width={'60%'} pl={5}>
                <Heading size={'md'}>{komikDetail.title}</Heading>
                <Text opacity={0.5} width={'100%'}>By {pengarang[0].Pengarang.trim()}</Text>
                <HStack space={1}>
                  <Image shadow={2} source={require('../../assets/star.png')} alt="Alternate Text" size={5} />
                  <Text fontWeight={'bold'}>{komikDetail.score}</Text>
                </HStack>
                {auth.currentUser ? <Button mt={2} leftIcon={<Icon as={Ionicons} name={isFavorite ? "heart-dislike-sharp" : "heart-sharp"} color={'white'} />} colorScheme={'red'} isLoading={loadingFavorite} spinnerPlacement="start" isLoadingText="Loading" onPress={async () => {
                  if (isFavorite) {
                    setLoadingFavorite(true)
                    await updateDoc(doc(db, 'users', auth.currentUser.email), {
                      favoriteManga: arrayRemove(favorite)
                    })
                      .finally(() => {
                        setLoadingFavorite(false)
                      })
                  } else {
                    setLoadingFavorite(true)
                    await updateDoc(doc(db, 'users', auth.currentUser.email), {
                      favoriteManga: arrayUnion({ endpoint: endpoint, date: timestamp })
                    })
                      .finally(() => {
                        setLoadingFavorite(false)
                      })
                  }
                }}>{isFavorite ? "Remove Favorite" : "Add Favorite"}</Button> : ""}
              </VStack>
            </HStack>
            <VStack paddingX={4}>
              <HStack paddingY={5} justifyContent={'space-between'} alignItems={'center'}>
                <Heading size={'sm'}>Synopsis</Heading>
              </HStack>
              <Text noOfLines={0}>{getSinopsis(komikDetail.sinopsis.trim(), komikDetail)}</Text>
            </VStack>
            <ScrollView horizontal>
              <HStack space={3} p={5}>
                {komikDetail.genre.map((value, index) => {
                  return (
                    <Badge colorScheme={colorMode === 'dark' ? 'warning' : 'success'} borderRadius={10} key={index}>{value.genre_title}</Badge>
                  )
                })}
              </HStack>
            </ScrollView>
            <ScrollView horizontal>
              <HStack space={4} paddingX={5}>
                {komikDetail.teaser.map((value, index) => {
                  return (
                    <Image key={index} shadow={100} source={{
                      uri: value.teaser_image
                    }} alt={`${title} teaser ${index + 1}`} resizeMode={'contain'} size={150} rounded="md" />
                  )
                })}
              </HStack>
            </ScrollView>
            {/* <HStack paddingX={4} pb={2} justifyContent={'space-around'}>
              {komikDetail.relative.map((value, index) => {
                return (
                  <HStack bgColor={'yellow.100'} color={'black'} key={value.link_ref} alignItems={'center'}>
                    {index === 0 && <IconButton icon={<ChevronLeftIcon />} />}
                    <Text>{value.title_ref.replace(' End', "")}</Text>
                    {index === 1 && <IconButton icon={<ChevronRightIcon />} />}
                  </HStack>
                )
              })}
            </HStack> */}
            <HStack paddingX={4} pt={10} pb={5} justifyContent={'space-between'} alignItems={'center'}>
              <Heading size={'sm'}>Episodes - {komikDetail.chapter_list.length}</Heading>
              <IconButton variant={'solid'} colorScheme={'amber'} _icon={{ as: MaterialCommunityIcons, name: "sort-clock-descending-outline" }} onPress={() => {

              }} />
            </HStack>
            <VStack paddingX={4} pb={2} space={2}>
              {komikDetail.chapter_list.map((value, index) => {
                return (
                  <HStack key={value.chapter_title} justifyContent={'space-between'}>
                    <HStack alignItems={'center'} space={1}>
                      <Image shadow={100} source={{
                        uri: komikDetail.thumb
                      }} alt="Alternate Text" size={50} rounded="md" />
                      <VStack>
                        <Heading color={'yellow.100'} size={'xs'}>Episode {value.chapter_title}</Heading>
                        <Text opacity={0.5}>{value.chapter_date}</Text>
                      </VStack>
                    </HStack>
                    <IconButton _icon={{ as: Feather, name: chapter?.includes(value.chapter_endpoint) ? "book-open" : "book" }} variant={chapter?.includes(value.chapter_endpoint) ? 'subtle' : 'solid'} colorScheme={'amber'} onPress={async () => {
                      if (auth.currentUser && !chapter?.includes(value.chapter_endpoint)) {
                        await updateDoc(doc(db, 'users', auth.currentUser.email), {
                          finishedChapter: arrayUnion({ title: endpoint, chapterEndpoint: value.chapter_endpoint, date: timestamp })
                        })
                        if (chapter.filter((item) => komikDetail.chapter_list.map((value) => value.chapter_endpoint).includes(item)).length === komikDetail.chapter_list.length - 1) {
                          await updateDoc(doc(db, 'users', auth.currentUser.email), {
                            finishedManga: arrayUnion({ title: endpoint, date: timestamp })
                          })
                        }
                      }
                      navigation.navigate('komikChapter', {
                        endpoint: value.chapter_endpoint
                      })
                    }} />
                  </HStack>
                )
              })}
            </VStack>
          </VStack>
        </ScrollView>
      </>
    )
  } else {
    return (
      <Loading />
    )
  }
}

export default KomikDetailScreen