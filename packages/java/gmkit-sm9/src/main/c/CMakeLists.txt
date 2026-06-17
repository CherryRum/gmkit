cmake_minimum_required(VERSION 3.10)

project(gmkitsm9 C)

#
# GMKit SM9 JNI 桥接库构建脚本。
#
# 依赖：
#   - JNI（通过 JAVA_HOME / find_package(JNI) 定位）
#   - GmSSL v3.1.1（头文件 <gmssl/sm9.h> 与共享库 gmssl）
#
# 用法：
#   cmake -DCMAKE_BUILD_TYPE=Release -DGMSSL_ROOT=/usr/local <source-dir>
#   cmake --build . --config Release
#
# 产物：libgmkitsm9.so / libgmkitsm9.dylib / gmkitsm9.dll
#

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# GmSSL 安装根目录，可通过 -DGMSSL_ROOT 或环境变量覆盖。
if(NOT GMSSL_ROOT)
    if(DEFINED ENV{GMSSL_ROOT})
        set(GMSSL_ROOT $ENV{GMSSL_ROOT})
    else()
        set(GMSSL_ROOT "/usr/local")
    endif()
endif()
message(STATUS "GMSSL_ROOT = ${GMSSL_ROOT}")

# 定位 JNI 头文件。
find_package(JNI REQUIRED)

# 定位 GmSSL 头文件与共享库。
find_path(GMSSL_INCLUDE_DIR
    NAMES gmssl/sm9.h
    HINTS "${GMSSL_ROOT}/include"
    PATHS /usr/local/include /usr/include)

find_library(GMSSL_LIBRARY
    NAMES gmssl libgmssl
    HINTS "${GMSSL_ROOT}/lib" "${GMSSL_ROOT}/bin"
    PATHS /usr/local/lib /usr/lib)

if(NOT GMSSL_INCLUDE_DIR)
    message(FATAL_ERROR "找不到 GmSSL 头文件 gmssl/sm9.h，请设置 -DGMSSL_ROOT")
endif()
if(NOT GMSSL_LIBRARY)
    message(FATAL_ERROR "找不到 GmSSL 共享库 gmssl，请设置 -DGMSSL_ROOT")
endif()
message(STATUS "GMSSL_INCLUDE_DIR = ${GMSSL_INCLUDE_DIR}")
message(STATUS "GMSSL_LIBRARY = ${GMSSL_LIBRARY}")

add_library(gmkitsm9 SHARED gmkitsm9.c)

set_target_properties(gmkitsm9 PROPERTIES
    C_STANDARD 99
    POSITION_INDEPENDENT_CODE ON)

target_include_directories(gmkitsm9 PRIVATE
    ${JNI_INCLUDE_DIRS}
    ${GMSSL_INCLUDE_DIR})

target_link_libraries(gmkitsm9 PRIVATE ${GMSSL_LIBRARY})

# 在类 Unix 平台设置 rpath 为 $ORIGIN / @loader_path，
# 使桥接库能在同目录找到一同分发的 gmssl 动态库。
if(APPLE)
    set_target_properties(gmkitsm9 PROPERTIES
        INSTALL_RPATH "@loader_path"
        BUILD_WITH_INSTALL_RPATH ON)
elseif(UNIX)
    set_target_properties(gmkitsm9 PROPERTIES
        INSTALL_RPATH "$ORIGIN"
        BUILD_WITH_INSTALL_RPATH ON)
endif()
